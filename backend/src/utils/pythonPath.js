import path from "path";
import os from "os";

export const getPythonPath = () => {
  const base = path.join(process.cwd(), "venv");
  if (os.platform() === "win32") {
    return path.join(base, "Scripts", "python.exe");
  } else {
    return path.join(base, "bin", "python");
  }
};
