const Docma = require("docma");

const config = {
  dest: "./docs",
  debug: 16,
  clean: true,
  app: {
    title: "Jsoning",
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width,initial-scale=1.0" },
    ],
    base: "/",
    entrance: "content:readme",
    server: Docma.ServerType.GITHUB,
  },
  src: ["src/jsoning.js", "./README.md"],
  template: {
    options: {
      title: "Jsoning",
      logo: "https://cdn.glitch.com/c393fad9-338a-43b4-9a2f-8ba07e26d39d%2Fjsoning.png?v=1589190601684",
      navbar: {
        menu: [
          { label: "Home", href: "/" },
          { label: "Documentation", href: "/?api", iconClass: "fas fa-book" },
          {
            label: "GitHub",
            href: "https://github.com/khalby786/jsoning",
            iconClass: "fab fa-github",
            target: "_blank",
          }
        ],
      },
      sidebar: {
        enabled: true,
        outline: "tree",
      },
    },
  },
  markdown: { 
      sanitize: true,
      gfm: true
  },
};

Docma.create()
  .build(config)
  .then(() => console.log("Docs yaay!"))
  .catch(console.error);