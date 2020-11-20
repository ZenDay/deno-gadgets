import { serve, Response, ServerRequest } from 'https://deno.land/std@0.78.0/http/server.ts';
import { serveFile } from 'https://deno.land/std@0.78.0/http/file_server.ts';
import { parse } from 'https://deno.land/std@0.78.0/flags/mod.ts';
import { posix, extname, basename } from 'https://deno.land/std@0.78.0/path/mod.ts';

const encoder = new TextEncoder();

interface CesiumServerArgs {
  _: string[];
  // -p --port
  p?: number;
  port?: number;
  // -h --help
  h?: boolean;
  help?: boolean;
}

const serverArgs = parse(Deno.args) as CesiumServerArgs;
const dir = posix.resolve(serverArgs._[0] ?? "");

function normalizeURL(url: string): string {
  let normalizedUrl = url;
  try {
    normalizedUrl = decodeURI(normalizedUrl);
  } catch (e) {
    if (!(e instanceof URIError)) {
      throw e;
    }
  }
  normalizedUrl = posix.normalize(normalizedUrl);
  const startOfParams = normalizedUrl.indexOf("?");
  return startOfParams > -1
    ? normalizedUrl.slice(0, startOfParams)
    : normalizedUrl;
}

function serveFallback(req: ServerRequest, e: Error): Promise<Response> {
  if (e instanceof Deno.errors.NotFound) {
    return Promise.resolve({
      status: 404,
      body: encoder.encode("Not found"),
    });
  } else {
    return Promise.resolve({
      status: 500,
      body: encoder.encode("Internal server error"),
    });
  }
}

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

function setTerrain (res: Response, filename: string): void {
  if (!res.headers) {
    res.headers = new Headers();
  }
  res.headers.set('Content-Type', 'application/octet-stream')
  res.headers.set('Content-Encoding', 'gzip')
  // Content-Disposition: attachment;filename=2948.terrain
  res.headers.set('Content-Disposition', `attachment;filename=${filename}`)
}

async function main () {
  const port = serverArgs.port ?? serverArgs.p ?? 8000;

  const server = serve({ port })

  for await (const req of server) {
    const fsPath = posix.join(dir, normalizeURL(req.url))

    let response: Response | undefined
    try {
      const fileInfo = await Deno.stat(fsPath);
      if (fileInfo.isDirectory) {
        throw new Deno.errors.NotFound();
      } else {
        response = await serveFile(req, fsPath);
        if (extname('.terrain')) {
          setTerrain(response, basename(fsPath))
        }
      }
    } catch (e) {
      response = await serveFallback(req, e);
    } finally {
      try {
        setCORS(response!);
        await req.respond(response!);
      } catch (e) {
        console.error(e.message);
      }
    }
  }
}

if (import.meta.main) {
  await main();
}
