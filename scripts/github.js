
const fs = require('fs-extra')
const path = require('path')
const { pinyin } = require('pinyin')
const _ = require('lodash')
const { Octokit } = require("@octokit/rest");
const { SocksProxyAgent } = require('socks-proxy-agent');
const downLoadImage = require('./downloadImage')
const debug = require('debug')('scripts:github')

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const agent = new SocksProxyAgent('socks://127.0.0.1:1086')
const opts = {
    auth: process.env.GH_TOKEN
}

if (process.env.NODE_ENV === 'local') {
    opts.request = { agent };
}

const octokit = new Octokit(opts)

const blogOutputPath = '../data/blog'

const issueJsonPath = path.join(__dirname, '../data/issues.json')


async function generateMdx(issue) {
  let { title, labels, created_at, updated_at, body } = issue
  body = body.replace(/<img(.*?)\/?>/g, '<img$1 />');
  const imageUrls = await downLoadImage(body)
  if (imageUrls.length) {
    imageUrls.forEach(({newUrl, oldUrl}) => {
        if (newUrl) {
            body = body.replace(oldUrl, newUrl);
        }
    })
  }
  const summary = ''
  return `---
  title: ${title}
  date: ${created_at}
  lastmod: ${updated_at}
  summary: ${summary}
  tags: ${JSON.stringify(labels.map(item => item.name))}
  draft: false
  layout: PostLayout
  bibliography: references-data.bib
---

${body.replace(/<br \/>/g, '\n')}
`
}

function getIssueJsonInStore() {
    if (!fs.pathExistsSync(issueJsonPath)) {
        return {}
    }
    try {
        const json = fs.readJsonSync(issueJsonPath)
        return json
    }catch(err) {
        console.log('getIssueJsonInStore err', err);
        return {}
    }
}

function updateIssuesJsonInStore(newDate, issuesJson) {
    try {
        const temp = newDate.filter((data) => {
            return data.body && data.labels.length
        }).reduce((prev, item) => {
            const {url, id, node_id, title, number, labels, state, created_at, updated_at } = item
            prev[id] = {
                url, id, node_id, title, number, labels, state, created_at, updated_at
            }
            return prev
        }, {})
        fs.outputJsonSync(issueJsonPath, {
            ...issuesJson,
            ...temp
        })
    } catch (error) {
        console.log('updateIssuesJsonInStore err', error);
    }
}

function getIssues() {
    return octokit.paginate('GET /repos/{owner}/{repo}/issues', {
        owner: process.env.OWNER,
        repo: process.env.REPO,
        // per_page: parseInt(process.env.PER_PAGE || 500),
        per_page: 10,
        creator: process.env.OWNER,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28'
        }
    })
}

const ignoreMds = [10, 80, 81, 51, 95, 45, 49, 32, 18, 17, 14, 6, 10]

function main() {
  const filePath = path.resolve(__dirname, blogOutputPath)
  const issuesJson = getIssueJsonInStore()
  const emptyMd = []
  getIssues().then(async (data) => {
    debug('data.length %d', data.length)
    // data = data.slice(0, 10);
    let successCount = 0
    fs.ensureDirSync(filePath)
    for (const item of data) {
      try {
        const lastIssues = issuesJson[item.id] || {};
        // 如果issue已经生成过了，且没有修改，则不需要再次生成
        if (item.updated_at === lastIssues.updated_at) {
            debug(`当前issue${item.title}已生成md文件`);
            successCount++
            continue;
        }
        if (!item.body || !item.labels.length || ignoreMds.includes(item.number)) {
            debug(`当前issue内容不存在，或者未完成创作`);
            successCount++
            emptyMd.push(item.title)
            continue;
        }
        const content = await generateMdx(item)
        const tempFileName = item.title.replace(/\//g, '&').replace(/、/g, '-').replace(/ - /g, '-').replace(/\s/g, '-')
        const result = pinyin(tempFileName, {
          style: 0,
        })
        const fileName = _.flatten(result).join('')
        fs.writeFileSync(`${filePath}/${fileName}.md`, content)
        debug(`${filePath}/${fileName}.md success`)
        successCount++
      } catch (error) {
        console.log(error)
      }
    }
    if (successCount === data.length) {
      console.log('文章全部同步成功！', data.length)
    } else {
      console.log('文章同步失败！失败数量=', data.length - successCount)
    }
    if (emptyMd.length) {
        console.log('未生成md的文件', emptyMd)
    }
    updateIssuesJsonInStore(data, issuesJson)
  }).catch((err) => {
    console.log('pull issue err', err);
  })
}

main()