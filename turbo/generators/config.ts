import { PlopTypes } from "@turbo/gen";
import type { Actions } from "node-plop";
import packageGenerator from "./src/package"


export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", packageGenerator);
}
