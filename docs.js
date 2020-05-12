const Docma = require("docma");
const Package = require("./package");

const config = {
  src:  [{jsoning: "./src/jsoning.js"}, {readme: './README.md'}],
  debug: 31,
  app: {
    title: Package.name,
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width,initial-scale=1.0" },
      { property: "og:url", content: Package.homepage },
      { property: "og:title", content: Package.name },
      { property: "og:description", content: Package.description },
      { property: "og:image", content: "images/jsoning.png" },
    ],
    base: "/jsoning",
    entrance: "content:readme",
    server: Docma.ServerType.GITHUB
  },
  template: {
    options: {
      title: Package.name,
      navbar: true,
      navItems: [
        {
          label: "README",
          href: "?content=readme",
          iconClass: "ico-md ico-info",
        },
        {
          label: "Documentation",
          href: `?api=${Package.name}`,
          iconClass: "ico-book",
        },
        {
          label: "GitHub",
          href: `https://github.com/${Package.repository}`,
          target: "_blank",
          iconClass: "ico-md ico-github",
        },
      ],
    },
  },
  dest: "./docs",
};
Docma.create()
  .build(config)
  .then((success) => console.log("Documentation is built successfully."))
  .catch((error) => console.log(error));
