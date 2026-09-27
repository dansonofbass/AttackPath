import { download } from "./download";
import { exportName } from "./format";
export function downloadJson(
  filename: string,
  value: unknown,
  suffix = "model",
) {
  download(
    `${exportName(filename)}-${suffix}.json`,
    JSON.stringify(value, null, 2),
    "application/json",
  );
}
