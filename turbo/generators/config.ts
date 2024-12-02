import { PlopTypes } from "@turbo/gen";
import packageGenerator from "./src/package";


export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", packageGenerator);
}
