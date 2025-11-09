import { SidebarsConfig } from "@docusaurus/plugin-content-docs";
const typedocSidebar: SidebarsConfig = {
  items: [
    {
      type: "category",
      label: "Guides",
      items: [
        {
          type: "doc",
          id: "virtuoso-reactive-engine-api/documents/External-Markdown",
          label: "External Markdown"
        }
      ]
    },
    {
      type: "category",
      label: "Other",
      items: [
        {
          type: "doc",
          id: "virtuoso-reactive-engine-api/@virtuoso.dev/reactive-engine",
          label: "@virtuoso.dev/reactive-engine"
        }
      ]
    }
  ]
};
export default typedocSidebar;