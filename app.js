const cookieParser = require('cookie-parser');
const express = require('express');
const ejs = require('ejs');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(cookieParser());

app.get('/', getDeployType, pageData, renderPage('index'));

app.listen(3000, () => console.log('Server on port 3000!'));

function getDeployType(req, res, next) {
  var deployType = req.cookies.fsDeployType;
  if (!deployType) {
    res.render('cookiesetter');
    return;
  }

  res.locals.deployType = deployType;
  next();
}

function pageData(req, res, next) {
  const modules = [
    "one.js"
  ]
  res.locals.headerCss = "";
  res.locals.headerJs = "";
  if (res.locals.deployType === 'mjs') {
    res.locals.footerJs = modules.map(file=>`<script type="module">import '/modules/mjs/${file}';</script>`).join('');
  }
  else {
    res.locals.footerJs = `<script src="/js/inject.js"></script>
<script>
  Inject.reset();
  Inject.setExpires(0); //Don't store files in localStorage
  Inject.setModuleRoot('/modules/cjs5');
  //Inject.addFileRule(key, manifest.js[key]); //tell inject to use hashed filename from client manifest
  Inject.disableAMD(true);
  require.ensure(${JSON.stringify(modules)});
</script>
    `;
  }
  next();
}

function renderPage(page) {
  return (req, res) => res.render(page);
}
