import { runCaptureJob } from '../app/lib/capture';

async function main() {
  const result = await runCaptureJob({ force: true, runKey: `manual-${Date.now()}` });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
