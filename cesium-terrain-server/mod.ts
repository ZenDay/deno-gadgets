import { serve, Response } from 'https://deno.land/std@0.78.0/http/server.ts';
import { serveFile } from 'https://deno.land/std@0.78.0/http/file_server.ts';
import { parse } from 'https://deno.land/std@0.78.0/flags/mod.ts';
import { posix } from 'https://deno.land/std@0.78.0/path/mod.ts';

interface CesiumServerArgs {
  _: string[];
}

const serverArgs = parse(Deno.args) as CesiumServerArgs;
const dir = posix.resolve(serverArgs._[0] ?? "");

function setCORS(res: Response): void {
  if (!res.headers) {
    res.headers = new Headers();
  }
  res.headers.append("access-control-allow-origin", "*");
  res.headers.append(
    "access-control-allow-headers",
    "Origin, X-Requested-With, Content-Type, Accept, Range",
  );
}

function setTerrain (res: Response): void {
  if (!res.headers) {
    res.headers = new Headers();
  }
  res.headers.set('Content-Type', 'application/octet-stream')
  res.headers.set('Content-Encoding', 'gzip')
  // Content-Disposition: attachment;filename=2948.terrain
  res.headers.set('Content-Disposition', 'attachment;filename=')
}


const server = serve({
  port: 8000
})

for await (const req of server) {
  // const response = await serveFile(req, target + req.url)
  console.log(dir + req.url)
  // setCORS(response)
  // req.respond(response)
}
