const https = require("https");
const { Octokit } = require("@octokit/core");
const fs = require("fs");

/**
 * create auth token in github and paste into Octokit params
 */
const octokit = new Octokit({
  auth: `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`,
});

let getInfo = (package, callback) => {
  return https.get(
    {
      host: "registry.npmjs.org",
      path: `/${package}`,
    },
    (res) => {
      let body = "";

      res.on("data", (data) => (body += data));
      res.on("end", () => callback(JSON.parse(body)));
    }
  );
};

fs.readFile("./package.json", "utf-8", async (err, data) => {
  if (err) {
    return;
  }

  const dependencies = JSON.parse(data).dependencies;

  let gitRepositories = [];

  for (let key in dependencies) {
    await new Promise((resolve) =>
      getInfo(`${key}`, (data) => {
        gitRepositories.push(data.repository.url);
        resolve();
      })
    );
  }

  const packagesInfo = [];
  for (let repository of gitRepositories) {
    const url = repository.split("github.com")[1].replace(".git", "");
    const _result = await octokit
      .request(`GET /repos${url}`)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        return err;
      });
    packagesInfo.push(_result);
  }

  const _data = new Uint8Array(Buffer.from(JSON.stringify(packagesInfo)));
  fs.writeFile("./result.json", _data, (err) => {});
});
