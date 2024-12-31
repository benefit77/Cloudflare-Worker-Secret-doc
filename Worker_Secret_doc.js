// 分享链接路径
const SharePath = '/s/';
// 分享ID长度，建议10-200位内
const ID_Length = 24;

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/submit') {
    return await createDocument(request);
  } else if (request.method === 'GET' && url.pathname.startsWith(SharePath)) {
    return await getDocument(url.pathname.replace(SharePath, ''));
  } else if (request.method === 'GET' && url.pathname === '/') {
    return new Response(renderHTML(), {
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  } else {
    return new Response('404', {
      status: 302,
      headers: {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Location': '/'
      }
    });
  }
}

async function createDocument(request) {
  try {
    const { text_doc } = await request.json();
    const id = generateId();
    const data = { text_doc }; // 存储原始 Markdown 文本
    await Worker_Secret_doc.put(id, JSON.stringify(data));
    const link = `${new URL(request.url).origin}${SharePath}${id}`;
    return new Response(JSON.stringify({ link }), {
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '创建文档失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    });
  }
}

function generateId(length = ID_Length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ-abcdefghijklmnopqrstuvwxyz_0123456789";
  let idString = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    idString += charset[randomIndex];
  }
  return idString;
}

async function getDocument(id) {
  try {
    const value = await Worker_Secret_doc.get(id);

    if (!value) {
      return new Response('文档不存在。', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
      });
    }

    const data = JSON.parse(value);
    await Worker_Secret_doc.delete(id);
    const htmlContent = renderShareHTML(data.text_doc); // 传入原始 Markdown 文本
    return new Response(htmlContent, {
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  } catch (error) {
    return new Response('未能获取文档。', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
    });
  }
}

async function deleteDocument(id) {
  try {
    await Worker_Secret_doc.delete(id);
    return new Response('文档已删除。', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
    });
  } catch (error) {
    return new Response('删除文档失败。', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
    });
  }
}

function renderHTML() {
  return `
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>秘密文档</title>
    <link rel="icon" type="image/png" href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPa3/ED6m/1NAnP9VQZH/VUOG/1VEff9ITnr1AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADy0/5s+q///P6D//0GV//9Civ//RID//5KCsIL0kE9V/pNHVf6UR1X+lEdV/pNHRv2SRgEAAAAAAAAAAAAAAAA7u/+pPbL//zCR5v8aZ7//PYz3/0OG//+7hoX//ZJI//6USP/+lEj//pRI//6USP/+k0dFAAAAAAAAAAAAAAAAOsL/qTy5//8ZcsD/AEaU/y+C4v9Cjf//uoiG//2TSP/+lEj//pRI//6USP/+lEj//pRHVQAAAAAAAAAAAAAAADnJ/6k7wP//Oa/4/y6R4/8/n/7/QZT//7mNh//8mUv//ppL//6aSv/+mUr//phK//6YSVUAAAAAAAAAAAAAAAA4zf5zOsf//Du8//89sf//Pqb//0qc9f/am23//aFO//6hTv/+oE7//qBN//6fTf/+nk1VAAAAAAAAAAAAAAAAAAAAAFfB4lmKsrT/8JVT/1ep5v/7pVL//alS//6oUf/+qFH//qdR//6mUf/+plD//qVQVQAAAAAAAAAAAAAAAAAAAADHsYBUb7/P/1S55/+jsqT//bBV//6wVf/9r1X//a1U//2sVP/9rFT//axT//2rU1UAAAAAAAAAAAAAAAAAAAAA+bhdU/65Wf/+uFn//rhZ//63Wf/+tlj/+7FX//mrVv/4p1b/96dV//mpVv/6q1VWAAAAAAAAAAAAAAAAAAAAAP7AXVP/wF3//8Bc//+/XP//vlz//btb//mwWf/1p1j/86FX//KfVv/zoFb/9qteVgAAAAAAAAAAAAAAAAAAAAD/x2BT/8dg///GYP//xl///8Vf//y+Xv/4uWn//tyt//7hsf/95K3/++WmxffIhQ0AAAAAAAAAAAAAAAAAAAAA/85jU//OY///zWP//81j///MYv/8xGH/+cR5//3jrv/85qr/++mmxfvopw0AAAAAAAAAAAAAAAAAAAAAAAAAAP/VZlP/1Wb//9Rm///UZv//02b//c1k//nLef/76af/+uyjxfrqow0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/22lR/9xq///baf//2mn//9pp//7XaP/51Xn/+e6gxfntoQ0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/95rD//fa5n/32up/99rqf7fa6n+3mup+914mvnokw0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP8AAIADAACAAwAAgAMAAIADAACAAwAAwAMAAMADAADAAwAAwAMAAMADAADABwAAwA8AAMAfAADAPwAA//8AAA==">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css">
    <script src="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js"></script>
    <style>
    body{font-family:Arial,sans-serif;line-height:1.5;padding:20px;box-sizing:border-box}
    .container{display:flex;flex-direction:column;align-items:center;max-width:600px;margin:0 auto}
    #editor{width:100%;margin-bottom:15px}
    #submit-button{width:100%;padding:10px;margin-bottom:15px}
    #result{width:100%;padding:10px;border:1px solid #ccc;box-sizing:border-box}
    /*textarea{width:100%;height:100%;padding:10px;box-sizing:border-box;border:1px solid #ccc; resize: vertical;}*/
    @media(max-width:600px){body{padding:10px}#editor{margin-bottom:10px}#submit-button{margin-bottom:10px}}
    /* SimpleMDE Editor Styles */
    .CodeMirror, .CodeMirror-scroll {
        min-height: 200px;
    }
    .editor-toolbar {
        background-color: #f8f9fa;
        border: none;
    }
    .editor-toolbar a {
        color: #333;
    }
    .editor-toolbar a.active, .editor-toolbar a:hover {
        background-color: #e9ecef;
        border-color: #e9ecef;
        color: #007bff;
    }
    </style>
</head>
<body>
    <h1>创建㊙️密文档</h1>
    <p>在下面输入文本</p>
    <div id="editor">
        <textarea id="markdown-editor" placeholder="请在此输入支持Markdown语法的文本"></textarea>
    </div>
    <button id="submit-button">创建链接🔗</button><br></br>
    <div id="link"></div><br></br>
    <div id="error" style="color: red;"></div>
    <footer>      
      <p>© 秘密文档 - 极简、<a href="https://github.com/benefit77/Cloudflare-Worker-Secret-doc" target="_blank" rel="noopener noreferrer">开源</a>的在线文档。</p>
    </footer>
    <script>
        var simplemde = new SimpleMDE({ element: document.getElementById("markdown-editor") });
        document.getElementById('submit-button').addEventListener('click', function() {
          const button = this;
            var content = simplemde.value(); // 获取 Markdown 编辑器的值
            const errorDiv = document.getElementById('error');
            const linkDiv = document.getElementById('link');

            if (!content) {
                errorDiv.textContent = '请输入文本内容';
                return;
            }

            button.disabled = true;
            errorDiv.textContent = '';
            linkDiv.innerHTML = '创建中...';
            
            fetch('/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text_doc: content }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.link) {
                    var linkDiv = document.getElementById('link');
                    linkDiv.innerHTML = '<strong>链接已生成</strong>  <a href="' + data.link + '" target="_blank">' + data.link + '</a>';
                } else {
                    alert('创建链接出错');
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('创建链接出错');
            })
            .finally (() => {
              button.disabled = false;
            });
        });
    </script>
</body>
</html>
      `;
}

function renderShareHTML(text_doc) {
  // 使用 marked 解析 Markdown 文本
  return `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>秘密文档</title>
      <link rel="icon" type="image/png" href="data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPa3/ED6m/1NAnP9VQZH/VUOG/1VEff9ITnr1AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADy0/5s+q///P6D//0GV//9Civ//RID//5KCsIL0kE9V/pNHVf6UR1X+lEdV/pNHRv2SRgEAAAAAAAAAAAAAAAA7u/+pPbL//zCR5v8aZ7//PYz3/0OG//+7hoX//ZJI//6USP/+lEj//pRI//6USP/+k0dFAAAAAAAAAAAAAAAAOsL/qTy5//8ZcsD/AEaU/y+C4v9Cjf//uoiG//2TSP/+lEj//pRI//6USP/+lEj//pRHVQAAAAAAAAAAAAAAADnJ/6k7wP//Oa/4/y6R4/8/n/7/QZT//7mNh//8mUv//ppL//6aSv/+mUr//phK//6YSVUAAAAAAAAAAAAAAAA4zf5zOsf//Du8//89sf//Pqb//0qc9f/am23//aFO//6hTv/+oE7//qBN//6fTf/+nk1VAAAAAAAAAAAAAAAAAAAAAFfB4lmKsrT/8JVT/1ep5v/7pVL//alS//6oUf/+qFH//qdR//6mUf/+plD//qVQVQAAAAAAAAAAAAAAAAAAAADHsYBUb7/P/1S55/+jsqT//bBV//6wVf/9r1X//a1U//2sVP/9rFT//axT//2rU1UAAAAAAAAAAAAAAAAAAAAA+bhdU/65Wf/+uFn//rhZ//63Wf/+tlj/+7FX//mrVv/4p1b/96dV//mpVv/6q1VWAAAAAAAAAAAAAAAAAAAAAP7AXVP/wF3//8Bc//+/XP//vlz//btb//mwWf/1p1j/86FX//KfVv/zoFb/9qteVgAAAAAAAAAAAAAAAAAAAAD/x2BT/8dg///GYP//xl///8Vf//y+Xv/4uWn//tyt//7hsf/95K3/++WmxffIhQ0AAAAAAAAAAAAAAAAAAAAA/85jU//OY///zWP//81j///MYv/8xGH/+cR5//3jrv/85qr/++mmxfvopw0AAAAAAAAAAAAAAAAAAAAAAAAAAP/VZlP/1Wb//9Rm///UZv//02b//c1k//nLef/76af/+uyjxfrqow0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/22lR/9xq///baf//2mn//9pp//7XaP/51Xn/+e6gxfntoQ0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/95rD//fa5n/32up/99rqf7fa6n+3mup+914mvnokw0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgP8AAIADAACAAwAAgAMAAIADAACAAwAAwAMAAMADAADAAwAAwAMAAMADAADABwAAwA8AAMAfAADAPwAA//8AAA==">
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1; padding: 20px; }
          pre { white-space: pre-wrap; word-wrap: break-word; padding: 15px; background: #f5f5f5; font-size: 24px; }
          @media (max-width: 768px) {
            body {
              padding: 10px;
            }
            pre {
              font-size: 14px;
            }
          }
      </style>
      <script>
          window.onload = function() {
              var text_doc = ${JSON.stringify(text_doc)};
              var count = 3;
              var preElement = document.querySelector('pre');
              var countdown = setInterval(function() {
                  if (count > 0) {
                      preElement.innerHTML = '<span style="color: #0000ff;"><strong>' + count + '秒后显示㊙️密内容</strong></span>';
                      count--;
                  } else {
                      clearInterval(countdown);
                      preElement.innerHTML = marked.parse(text_doc); // 解析 Markdown 并渲染
                  }
              }, 1000);
          };
      </script>
  </head>
  <body>
      <pre></pre>
  </body>
  </html>  
  `;
}