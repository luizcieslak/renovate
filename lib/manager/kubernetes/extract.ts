import { logger } from '../../logger';
import { getDep } from '../dockerfile/extract';
import { PackageFile, PackageDependency } from '../common';

export function extractPackageFile(content: string): PackageFile | null {
  logger.trace('kubernetes.extractPackageFile()');
  let deps: PackageDependency[] = [];
  let lineNumber = 0;

  const isKubernetesManifest =
    /\s*apiVersion\s*:/.test(content) && /\s*kind\s*:/.test(content);
  if (!isKubernetesManifest) {
    return null;
  }

  for (const line of content.split('\n')) {
    const match = /^\s*-?\s*image:\s*'?"?([^\s'"]+)'?"?\s*$/.exec(line);
    if (match) {
      const currentFrom = match[1];
      const dep = getDep(currentFrom);
      logger.debug(
        {
          depName: dep.depName,
          currentValue: dep.currentValue,
          currentDigest: dep.currentDigest,
        },
        'Kubernetes image'
      );
      dep.managerData = { lineNumber };
      deps.push(dep);
    }
    lineNumber += 1;
  }
  deps = deps.filter(
    dep => !(dep.currentValue && dep.currentValue.includes('${'))
  );
  if (!deps.length) {
    return null;
  }
  return { deps };
}
