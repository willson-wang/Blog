---
  title: JavaScript中的AST
  date: 2019-09-12T09:53:48Z
  lastmod: 2019-11-17T01:50:56Z
  summary: 
  tags: ["开发工具"]
  draft: false
  layout: PostLayout
  images: ['/static/images/banner/ast.jpeg']
  bibliography: references-data.bib
---

# 目录
1. 什么是AST
2. JavaScript属于哪种类型语言
3. The ESTree specification.
4. 常用的JavaScript Parser
5. 生成AST的过程
6. AST在JavaScript内的应用场景
7. 总结

### 什么是AST

AST（Abstract Syntax Tree，抽象语法树）在 [Wikipedia](https://en.wikipedia.org/wiki/Abstract_syntax_tree) 的定义如下：

> In computer science, an abstract syntax tree (AST), or just syntax tree, is a tree representation of the abstract syntactic structure of source code written in a programming language.Each node of the tree denotes a construct occurring in the source code.

> 在计算机科学中，抽象语法树（AST）或语法树是用编程语言编写的源代码的抽象语法结构的树表示。
树的每个节点表示在源代码中出现的构造。

### JavaScript属于哪种类型语言

计算机语言按类型分可以分为编译型语言及解释型语言

[编译型语言](https://en.wikipedia.org/wiki/Compiled_language)

> A compiled language is a programming language whose implementations are typically compilers (translators that generate machine code from source code), and not interpreters (step-by-step executors of source code, where no pre-runtime translation takes place).

> 编译语言是一种编程语言，其实现需要借助编译器（从源代码生成机器代码的转换器），而不是解释器（源代码的逐步执行器，其中不发生运行前转换）

编译：将高级语言翻译成汇编语言or机器语言的过程

编译器：将高级语言翻译成汇编语言or机器语言的程序

编译流程,一般包含以下几个步骤

```
**字符流**
    ||
**词法分析**  ===> 从左至右逐行扫描程序的字符，识别出各个单词，确定含有，将识别出的单词转化成统一的机内表示-词法单元
    || 词法单元流
**语法分析**  ===> 从词法分析输出的token序列中识别出各类短语，并构造出语法分析树
    || 语法树
**语义分析**  ===> 收集标识符的属性信息，进行语义检查，修正语法树
    || 语法数
**中间代码生成**  ===> 中间代码是向目标码过渡的一种编码，其形式尽可能和机器的汇编语言相似，以便下一步的代码生成。
    || 中间表现形式
**机器无关代码优化** ===> 对中间码程序做局部优化和全局 (整个程序)优化，目的是使运行更快，占用空间最小
    || 中间表现形式
**目标代码生成**  ===>  由代码生成器生成目标机器的目标码 (或汇编)程序，其中包括数据分段、选定寄存器等工作，然后生成机器可执行的代码
    ||
**机器相关代码优化** ===> 对目标代码做局部优化和全局 (整个程序)优化，目的是使运行更快，占用空间最小
    ||
**目标代码**
```

[解释型语言](https://en.wikipedia.org/wiki/Interpreted_language)

> An interpreted language is a type of programming language for which most of its implementations execute instructions directly and freely, without previously compiling a program into machine-language instructions. The interpreter executes the program directly, translating each statement into a sequence of one or more subroutines, and then into another language (often machine code).

> 解释语言是一种编程语言，其大多数实现直接且自由地执行指令，而无需先前将程序编译成机器语言指令。解释器直接执行程序，将每个语句转换为一个或多个子例程的序列，然后转换为另一种语言（通常是机器代码）

解释型语言和编译型语言没有明确的界限，因为理论上任何编程语言都可以被解释或编译。

常见的程序设计语言，如 C/C++ 、 Pascal 、 FORTRAN 等都是编译型语言，用这些语言编写的源程序，都需要进行编译、连接，才能生成可执行程序。这对于大型程序、系统程序、支持程序来说是十分有利的，虽然编译时花费了不少时间，但程序的执行效率是很高的。不过，在有些场合，对程序的执行效率要求不高的场合，没有必要在编译上花费大量的时间，可以对高级语言源程序采取解释执行的方式。

解释执行需要有一个解释器 (Interpreter) ，它将源代码逐句读入。第一步先作词法分析，建立内部符号表；再作语法和语义分析，并作类型检查 ( 解释语言的语义检查一般比较简单，因为它们往往采用无类型或动态类型系统 ) 。完成检查后把每一语句压入执行堆栈，并立即解释执行。因为解释执行时只看到一个语句，无法对整个程序进行优化。但是解释执行占用空间很少。操作系统的命令、Visual Basic、Python、JavaScript 都是解释执行的 ( 其中有些语言也可以编译执行 ) 。解释器不大，工作空间也不大，不过，解释型应用占用更多的内存和CPU资源。这是由于，为了运行解释型语言编写的程序，相关的解释器必须首先运行。解释器是复杂的，智能的，大量消耗资源的程序并且它们会占用很多CPU周期和内存，另外解释型应用的decode-fetch-execute（解码-抓取-执行）的周期，它们比编译型程序慢很多

JavaScript 是一门解释型语言，所以其解释过程如下所示,解释器则是浏览器JavaScript引擎(V8, Chakra, SpiderMonkey, Nitro, etc.)

```
  **字符流**
      ||
**分词／词法分析**   ===>   把字符串分解成有意义的代码块，这些代码块被称为词法单元
      ││
**解析／语法分析**   ===>   词法单元流（数组）转换成一个由元素逐级嵌套所组成的代表了程序语法结构的树，即 AST
      ││
  **代码生成**   ===>   将 AST 转换为可执行代码
```

### The ESTree specification

The ESTree Spec: AST语法树规范，一位Mozilla工程师在Firefox中创建了一个API，将SpiderMonkey引擎的JavaScript解析器公开为JavaScript API。所述工程师记录了它产生的格式，这种格式作为操纵JavaScript源代码的工具的通用语言，现在遵循这个规范的parser有Esprima、acorn、espree、@babel/parser

SpiderMonkey Parser API

> SpiderMonkey is Mozilla's JavaScript engine written in C and C++. It is used in various Mozilla products, including Firefox, and is available under the MPL2.

> SpiderMonkey是Mozilla用C和C ++编写的JavaScript引擎。它用于各种Mozilla产品，包括Firefox，可在MPL2下使用。

SpiderMonkey 提供来了一系列可供Js操作的API，如Reflect.parse(src[, options]),通过给parse传递js源代码，最后生成被解析的抽象语法树（AST）的程序对象;

默认情况下, Reflect.parse() 生成Node对象, 即普通的JavaScript对象 (它们的原型来自标准的Object原型). 所有的节点类型都实现了以下的接口

```
// 节点接口，必须有type字段，代表AST变量类型，使用这个字段去决定一个节点要实现的接口，如Program，Function都
interface Node {
    type: string;
    loc: SourceLocation | null;
}

interface SourceLocation {
    source: string | null;
    start: Position;
    end: Position;
}

interface Position {
    line: uint32 >= 1;
    column: uint32 >= 0;
}
```

什么是接口，在TypeScript中的定义为，核心原则之一是对值所具有的结构进行类型检查。 它有时被称做“鸭式辨型法”或“结构性子类型化”。 在TypeScript里，接口的作用就是为这些类型命名和为你的代码或第三方代码定义契约

举个例子

```
function printLabel(labelledObj: { label: string }) {
  console.log(labelledObj.label);
}

let myObj = { size: 10, label: "Size 10 Object" };
printLabel(myObj);
```

使用接口来重写

```
interface LabelledValue {
  label: string;
}

function printLabel(labelledObj: LabelledValue) {
  console.log(labelledObj.label);
}

let myObj = {size: 10, label: "Size 10 Object"};
printLabel(myObj);
```

更多有关接口的内容，可以直接查看[ts文档](https://www.typescriptlang.org/docs/handbook/interfaces.html)

AST中主要有以下接口

程序，一个完整的程序源代码树。一般就是一个单独的js文件
```
interface Program <: Node {
    type: "Program";
    body: [ Statement ];
}
```

如图所示，以Esprima为例，因为Esprima，因为Esprima语法树格式源自Mozilla Parser API的原始版本，然后将其形式化并扩展为ESTree规范

函数接口
```
interface Function <: Node {
    id: Identifier | null; // 函数名
    params: [ Pattern ];  // 参数
    defaults: [ Expression ]; 
    rest: Identifier | null; // rest参数
    body: BlockStatement | Expression; // 函数块
    generator: boolean; // 是否是generator函数
    expression: boolean;
}
```

任意语句接口
```
interface Statement <: Node { }
```

空语句接口，一个空语句,也就是,一个孤立的分号
```
interface EmptyStatement <: Statement {
    type: "EmptyStatement";
}
```

块语句接口，也就是由大括号包围的语句序列.
```
interface BlockStatement <: Statement {
    type: "BlockStatement";
    body: [ Statement ];
}
```

表达式语句接口，一个表达式语句,也就是,仅有一个表达式组成的语句
```
interface ExpressionStatement <: Statement {
    type: "ExpressionStatement";
    expression: Expression;
}
```

一个if语句接口
```
interface IfStatement <: Statement {
    type: "IfStatement";
    test: Expression;
    consequent: Statement;
    alternate: Statement | null;
}
```

一个标签语句接口,也就是, a statement prefixed by a break/continue label
```
interface LabeledStatement <: Statement {
    type: "LabeledStatement";
    label: Identifier;
    body: Statement;
}
```

一个break语句接口
```
interface BreakStatement <: Statement {
    type: "BreakStatement";
    label: Identifier | null;
}
```

一个continue语句接口
```
interface ContinueStatement <: Statement {
    type: "ContinueStatement";
    label: Identifier | null;
}
```

一个with语句接口
```
interface WithStatement <: Statement {
    type: "WithStatement";
    object: Expression;
    body: Statement;
}
```

一个switch语句接口
```
interface SwitchStatement <: Statement {
    type: "SwitchStatement";
    discriminant: Expression;
    cases: [ SwitchCase ];
    lexical: boolean;
}
```

一个return语句接口
```
interface ReturnStatement <: Statement {
    type: "ReturnStatement";
    argument: Expression | null;
}
```

一个throw语句接口
```
interface ThrowStatement <: Statement {
    type: "ThrowStatement";
    argument: Expression;
}
```

一个try语句接口
```
interface TryStatement <: Statement {
    type: "TryStatement";
    block: BlockStatement;
    handlers: [ CatchClause ];
    finalizer: BlockStatement | null;
}
```

一个while语句接口
```
interface WhileStatement <: Statement {
    type: "WhileStatement";
    test: Expression;
    body: Statement;
}
```

一个do/while语句接口
```
interface DoWhileStatement <: Statement {
    type: "DoWhileStatement";
    body: Statement;
    test: Expression;
}
```

一个for语句接口
```
interface ForStatement <: Statement {
    type: "ForStatement";
    init: VariableDeclaration | Expression | null;
    test: Expression | null;
    update: Expression | null;
    body: Statement;
}
```

一个for/in语句接口, or, if each is true, a for each/in 语句.
```
interface ForInStatement <: Statement {
    type: "ForInStatement";
    left: VariableDeclaration |  Expression;
    right: Expression;
    body: Statement;
    each: boolean;
}
```

一个let语句接口
```
interface LetStatement <: Statement {
    type: "LetStatement";
    head: [ { id: Pattern, init: Expression | null } ];
    body: Statement;
}
```

一个debugger语句接口
```
interface DebuggerStatement <: Statement {
    type: "DebuggerStatement";
}
```

声明接口
```
interface Declaration <: Statement { }
```

一个函数声明接口
```
interface FunctionDeclaration <: Function, Declaration {
    type: "FunctionDeclaration";
    id: Identifier;
    params: [ Pattern ];
    defaults: [ Expression ];
    rest: Identifier | null;
    body: BlockStatement | Expression;
    generator: boolean;
    expression: boolean;
}
```

一个变量声明接口,可以通过var, let, 或const
```
interface VariableDeclaration <: Declaration {
    type: "VariableDeclaration";
    declarations: [ VariableDeclarator ];
    kind: "var" | "let" | "const";
}
```

一个变量声明符接口
```
interface VariableDeclarator <: Node {
    type: "VariableDeclarator";
    id: Pattern;
    init: Expression | null;
}
```

任意表达式接口
```
interface Expression <: Node, Pattern { }
```

一个this表达式接口
```
interface ThisExpression <: Expression {
    type: "ThisExpression";
}
```

一个数组表达式接口
```
interface ArrayExpression <: Expression {
    type: "ArrayExpression";
    elements: [ Expression | null ];
}
```

一个对象表达式接口
```
interface ObjectExpression <: Expression {
    type: "ObjectExpression";
    properties: [ { key: Literal | Identifier,
                    value: Expression,
                    kind: "init" | "get" | "set" } ];
}
```

一个函数表达式接口
```
interface FunctionExpression <: Function, Expression {
    type: "FunctionExpression";
    id: Identifier | null;
    params: [ Pattern ];
    defaults: [ Expression ];
    rest: Identifier | null;
    body: BlockStatement | Expression;
    generator: boolean;
    expression: boolean;
}
```

一个序列表达式接口,也就是一个由逗号分割的表达式序列
```
interface SequenceExpression <: Expression {
    type: "SequenceExpression";
    expressions: [ Expression ];
}
```

一元运算符表达式接口
```
interface UnaryExpression <: Expression {
    type: "UnaryExpression";
    operator: UnaryOperator;
    prefix: boolean;
    argument: Expression;
}
```

一个二元运算符表达式接口
```
interface BinaryExpression <: Expression {
    type: "BinaryExpression";
    operator: BinaryOperator;
    left: Expression;
    right: Expression;
}
```

赋值表达式接口
```
interface AssignmentExpression <: Expression {
    type: "AssignmentExpression";
    operator: AssignmentOperator;
    left: Expression;
    right: Expression;
}
```

自增自减表达式接口
```
interface UpdateExpression <: Expression {
    type: "UpdateExpression";
    operator: UpdateOperator;
    argument: Expression;
    prefix: boolean;
}
```

逻辑运算符表达式接口
```
interface LogicalExpression <: Expression {
    type: "LogicalExpression";
    operator: LogicalOperator;
    left: Expression;
    right: Expression;
}
```

条件运算符表达式接口
```
interface ConditionalExpression <: Expression {
    type: "ConditionalExpression";
    test: Expression;
    alternate: Expression;
    consequent: Expression;
}
```

new操作符表达式接口
```
interface NewExpression <: Expression {
    type: "NewExpression";
    callee: Expression;
    arguments: [ Expression ] | null;
}
```

函数调用表达式接口
```
interface CallExpression <: Expression {
    type: "CallExpression";
    callee: Expression;
    arguments: [ Expression ];
}
```

属性表达式接口
```
interface MemberExpression <: Expression {
    type: "MemberExpression";
    object: Expression;
    property: Identifier | Expression;
    computed : boolean;
}
```

yield表达式接口
```
interface YieldExpression <: Expression {
    argument: Expression | null;
}
```

generator表达式接口
```
interface GeneratorExpression <: Expression {
    body: Expression;
    blocks: [ ComprehensionBlock ];
    filter: Expression | null;
}
```

let表达式接口
```
interface LetExpression <: Expression {
    type: "LetExpression";
    head: [ { id: Pattern, init: Expression | null } ];
    body: Expression;
}
```

模式接口
```
interface Pattern <: Node { }
```

对象结构赋值模式接口
```
interface ObjectPattern <: Pattern {
    type: "ObjectPattern";
    properties: [ { key: Literal | Identifier, value: Pattern } ];
}
```

数组结构赋值模式接口
```
interface ArrayPattern <: Pattern {
    type: "ArrayPattern";
    elements: [ Pattern | null ];
}
```

case模式接口
```
interface SwitchCase <: Node {
    type: "SwitchCase";
    test: Expression | null;
    consequent: [ Statement ];
}
```

catch字句接口
```
interface CatchClause <: Node {
    type: "CatchClause";
    param: Pattern;
    guard: Expression | null;
    body: BlockStatement;
}
```

标识符。标识符可以是表达式或解构模式。
```
interface Identifier <: Node, Expression, Pattern {
    type: "Identifier";
    name: string;
}
```

字面标记。字面可以是表达式
```
interface Literal <: Node, Expression {
    type: "Literal";
    value: string | boolean | null | number | RegExp;
}
```

一元操作符
```
enum UnaryOperator {
    "-" | "+" | "!" | "~" | "typeof" | "void" | "delete"
}
```

二元操作符
```
enum BinaryOperator {
    "==" | "!=" | "===" | "!=="
         | "<" | "<=" | ">" | ">="
         | "<<" | ">>" | ">>>"
         | "+" | "-" | "*" | "/" | "%"
         | "|" | "^" | "in"
         | "instanceof" | ".."
}
```

逻辑运算符
```
enum LogicalOperator {
    "||" | "&&"
}
```

赋值运算符
```
enum AssignmentOperator {
    "=" | "+=" | "-=" | "*=" | "/=" | "%="
        | "<<=" | ">>=" | ">>>="
        | "|=" | "^=" | "&="
}
```

自增自减操作符
```
enum UpdateOperator {
    "++" | "--"
}
```

ES6新增的接口

箭头函数接口
```
interface ArrowFunctionExpression {
    type: 'ArrowFunctionExpression';
    id: Identifier | null;
    params: FunctionParameter[];
    body: BlockStatement | Expression;
    generator: boolean;
    async: boolean;
    expression: false;
}
```

Class类接口
```
interface ClassDeclaration {
    type: 'ClassDeclaration';
    id: Identifier | null;
    superClass: Identifier | null;
    body: ClassBody;
}

interface ClassExpression {
    type: 'ClassExpression';
    id: Identifier | null;
    superClass: Identifier | null;
    body: ClassBody;
}

interface ClassBody {
    type: 'ClassBody';
    body: MethodDefinition[];
}

interface MethodDefinition {
    type: 'MethodDefinition';
    key: Expression | null;
    computed: boolean;
    value: FunctionExpression | null;
    kind: 'method' | 'constructor';
    static: boolean;
}

interface Super {
    type: 'Super';
}
```

```
interface TaggedTemplateExpression {
    type: 'TaggedTemplateExpression';
    readonly tag: Expression;
    readonly quasi: TemplateLiteral;
}

interface TemplateElement {
    type: 'TemplateElement';
    value: { cooked: string; raw: string };
    tail: boolean;
}

interface TemplateLiteral {
    type: 'TemplateLiteral';
    quasis: TemplateElement[];
    expressions: Expression[];
}
```

```
interface SpreadElement {
    type: 'SpreadElement';
    argument: Expression;
}
```

```
interface AwaitExpression {
    type: 'AwaitExpression';
    argument: Expression;
}
```

```
type ImportDeclaration {
    type: 'ImportDeclaration';
    specifiers: ImportSpecifier[];
    source: Literal;
}

interface ImportSpecifier {
    type: 'ImportSpecifier' | 'ImportDefaultSpecifier' | 'ImportNamespaceSpecifier';
    local: Identifier;
    imported?: Identifier;
}
```

```
interface ExportAllDeclaration {
    type: 'ExportAllDeclaration';
    source: Literal;
}

interface ExportDefaultDeclaration {
    type: 'ExportDefaultDeclaration';
    declaration: Identifier | BindingPattern | ClassDeclaration | Expression | FunctionDeclaration;
}

interface ExportNamedDeclaration {
    type: 'ExportNamedDeclaration';
    declaration: ClassDeclaration | FunctionDeclaration | VariableDeclaration;
    specifiers: ExportSpecifier[];
    source: Literal;
}

interface ExportSpecifier {
    type: 'ExportSpecifier';
    exported: Identifier;
    local: Identifier;
};
```

### 常用的Javascript Parser

[Esprima](https://esprima.org/) 经典的AST解析器,文档齐全；
[UglifyJS](https://github.com/mishoo/UglifyJS) 最初的代码代码压缩工具，自带AST解析器，但没有遵守The ESTree Spec
[UglifyJS2](https://github.com/mishoo/UglifyJS2) UglifyJS重构后的版本，自带AST解析器，一样没有遵守The ESTree Spec
[acorn](https://github.com/acornjs/acorn) 借鉴了Esprima内的一些实现思路，相对于esprima、UglifyJS2性能更优
[espree](https://github.com/eslint/espree) eslint内置的parser，基于Esprima一个分支创建的parser
[@babel/parser](https://github.com/babel/babel/tree/master/packages/babel-parser) babel内置的parser，基于acorn

各个 parser解析的速度对比可以参见 [Speed Comparison](https://esprima.org/test/compare.html)

Esprima的使用方式
```
var esprima = require('esprima');
var program = 'const answer = 42';

esprima.tokenize(program);
[ { type: 'Keyword', value: 'const' },
  { type: 'Identifier', value: 'answer' },
  { type: 'Punctuator', value: '=' },
  { type: 'Numeric', value: '42' } ]

esprima.parse(program);
{ type: 'Program',
  body:
   [ { type: 'VariableDeclaration',
       declarations: [Object],
       kind: 'const' } ],
  sourceType: 'script' }
```

### 怎样生成AST

以the-super-tiny-compiler来分析

```
function tokenizer(input) {

  // 定义一个current变量，像光标一样记录我们字符串代码的位置
  let current = 0;

  // 定义一个tokens数组
  let tokens = [];

  // 我们从一个while循环开始，然后让current变量自增
  // 我们这样做的目的是要在单次循环中，通过current自增获取到整个tokens数组
  while (current < input.length) {

    // 读取字符串code
    let char = input[current];

    // 我们将要做的第一件事就是检查是否有扣号。因为括号会用于后面的函数调用，但是现在我们只需要关系括号这个符号

    if (char === '(') {

      // If we do, we push a new token with the type `paren` and set the value
      // to an open parenthesis.
      tokens.push({
        type: 'paren',
        value: '(',
      });

      // Then we increment `current`
      current++;

      // And we `continue` onto the next cycle of the loop.
      continue;
    }

    // Next we're going to check for a closing parenthesis. We do the same exact
    // thing as before: Check for a closing parenthesis, add a new token,
    // increment `current`, and `continue`.
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
      });
      current++;
      continue;
    }

    // 接下来我们将检查空白字符，这很有趣，因为我们需要关系空白字符是否是分割符，但是在实际生成token的时候没有什么用
    // 所以我们需要检查是否是空白字符，如果是则跳过
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // 接下来的类型是number,这与我们之前见到的不一样，因为数字可以是任意数量的字符。我们希望将整个字符序列捕获为一个令牌token
    //
    //   (add 123 456)
    //        ^^^ ^^^
    //        Only two separate tokens
    //
    // So we start this off when we encounter the first number in a sequence.

    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {

      // We're going to create a `value` string that we are going to push
      // characters to.
      let value = '';

      // 我们将要循环遍历数值之后的字符，直到不是数字为止，然后继续下一次遍历
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // After that we push our `number` token to the `tokens` array.
      tokens.push({ type: 'number', value });

      // And we continue on.
      continue;
    }

    // 我们还将职称使用双引号引用的任何文本
    //
    //   (concat "foo" "bar")
    //            ^^^   ^^^ string tokens
    //
    // We'll start by checking for the opening quote:
    if (char === '"') {
      // Keep a `value` variable for building up our string token.
      let value = '';

      // We'll skip the opening double quote in our token.
      char = input[++current];

      // 我们将遍历每个字符，直到到达另一个双引号为止。
      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      // Skip the closing double quote.
      char = input[++current];

      // And add our `string` token to the `tokens` array.
      tokens.push({ type: 'string', value });

      continue;
    }

    // 最后的token类型为name，这是一串有序的字母而不是数字，它代表了lisp语法中的函数名
    //
    //   (add 2 4)
    //    ^^^
    //    Name token
    //
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';

      // Again we're just going to loop through all the letters pushing them to
      // a value.
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // And pushing that value as a token with the type `name` and continuing.
      tokens.push({ type: 'name', value });

      continue;
    }

    // 最后，如果没有匹配上上面的任意条件则抛出错误
    throw new TypeError('I dont know what this character is: ' + char);
  }

  // 最后返回一个tokens数组
  return tokens;
}

function parser(tokens) {

  // 我们使用一个current变量，像光标一样来描述我们的位置
  let current = 0;

  // 但是这一次我们将要使用递归来代替while循环，我们定义一个walk函数
  function walk() {

    // 根据current读取对应的token
    let token = tokens[current];

    // 我们将把每种类型的令牌分成不同的代码路径，从number类型的token开始
    // We test to see if we have a `number` token.
    if (token.type === 'number') {

      // If we have one, we'll increment `current`.
      current++;

      // And we'll return a new AST node called `NumberLiteral` and setting its
      // value to the value of our token.
      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }

    // If we have a string we will do the same as number and create a
    // `StringLiteral` node.
    if (token.type === 'string') {
      current++;

      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // 我们将要根据左括号来定义，函数调用表达式节点
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {

      // 直接跳过括号，因为在AST中我们不在乎括号
      token = tokens[++current];

      // 我们接着创建一个函数调用表达式节点，然后将左括号的后一个token作为函数名
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // 然后我们继续自增，后去函数名之后的token
      token = tokens[++current];

      // 我们将继续遍历每一个token，每一个token作为函数调用表达式的参数，直到右括号
      // 现在这就是递归的来源。与其尝试解析可能无限嵌套的节点集，不如依靠递归来解决它。
      // 为了解释这个，我们看下Lisp的代码，你能看到函数add后面跟来数字参数及一个嵌套的包含两个数字参数的函数调用表达式
      //
      //   (add 2 (subtract 4 2))
      //
      // You'll also notice that in our tokens array we have multiple closing
      // parenthesis.

      // 你也能够注意到，我们的tokens数组中有多个右括号
      //
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //   ]
      //
      // 我们将要通过walk函数来及自增的crurrent变量来解析任何嵌套的函数调用表达式

      // 所以我们将要创建一个while循环，当type为为右括号时结束循环
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        // we'll call the `walk` function which will return a `node` and we'll
        // push it into our `node.params`.

        // 调用walk函数生成新的节点作为params的元素
        node.params.push(walk());
        token = tokens[current];
      }

      // 最后通过自增来跳过右括号
      current++;

      // And return the node.
      return node;
    }

    // Again, if we haven't recognized the token type by now we're going to
    // throw an error.
    throw new TypeError(token.type);
  }
  
  // 我们创建一个ast对象，该对象包含一个Program的根节点
  let ast = {
    type: 'Program',
    body: [],
  };

  // 我们使用walk方法生成节点，然后将节点push到ast.body内
  // 我们在循环内执行此操作的原因是因为我们的程序可以一个接一个的拥有CallExpression而不是嵌套的。
  //
  //   (add 2 2)
  //   (subtract 4 2)
  //
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // At the end of our parser we'll return the AST.
  return ast;
}
```

### AST在JavaScript内的应用场景

在明白了js代码最终是被生成AST，然后被解释执行之后，那么只要涉及到代码处理的场景，都可以运用AST来帮助我们处理对应的场景；
如：代码压缩(uglify)、代码检查(eslint)、代码转化(babel)、代码格式化(prettier)、构建打包(webpack、rollup)、IDE只能提示、代码混淆等

### 总结

随着近年来JavaScript的快速发展，前段开发越来越自动化，工程化，而AST在这其中扮演着一个重要的角色，它帮助开发来很多提高开发效率的工具，而当我们掌握来AST之后，我们自己也可以去任何可以提高我们工作效率的工具；

在线demo链接
https://astexplorer.net/#/gist/660493971bb8114cf17e9eacdd26c153/ed03f1df9b6eb48444ec81f5ba76a0babc4f33f3

参考链接
https://eslint.org/blog/2014/12/espree-esprima
http://marijnhaverbeke.nl/blog/acorn.html
http://lisperator.net/blog/should-you-switch-to-uglifyjs2/
http://lisperator.net/blog/uglifyjs-why-not-switching-to-spidermonkey-ast/
https://github.com/estree/estree
https://esprima.readthedocs.io/en/4.0/syntax-tree-format.html
https://juejin.im/entry/5a76b569f265da4e7f357629
https://hacks.mozilla.org/2017/02/a-crash-course-in-just-in-time-jit-compilers/
https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
https://github.com/jamiebuilds/the-super-tiny-compiler
