import * as fs from 'fs';
import path from 'path';

const fieldName = 'EUROPE'

const fieldDir = './front/src/assets/fields/' + fieldName

interface Route {
    id: string
    from: string
    to: string
    points: number
    isLong: boolean,
    fileName: string | undefined
}

function processRoutes(dir: string, isLong: boolean) {
    const routesfiles = fs.readdirSync(path.join(fieldDir, dir));
    const result: Route[] = []
    for (const file of routesfiles) {
        const nameParts = file.split(/[-\\.]/)
        const from = nameParts[0]
        const to = nameParts[1]
        result.push({
            id: from + to,
            from: from,
            to: to,
            points: Number(nameParts[2]),
            isLong: isLong,
            fileName: file
        })
    }
    return result
}

const routes = processRoutes('routes', false)
const longRoutes = processRoutes('long-routes', true)

const allRoutes = [...routes, ...longRoutes]

const stream = fs.createWriteStream('./processing/output/routesImages.ts', { flags: 'w' });
for (let route of allRoutes) {
    stream.write(`import ${route.id} from '../../assets/fields/${fieldName}/${route.isLong ? 'long-routes' : 'routes'}/${route.fileName}'\r\n`)
}

stream.write(`\r\nexport const RouteImages: Record<string, string> = {\r\n`)
for (let route of allRoutes) {
    stream.write(` '${route.id}': ${route.id},\r\n`)
}
stream.write(`}`);

allRoutes.forEach(route => route.fileName = undefined)
fs.writeFileSync('./processing/output/routes.json', JSON.stringify(allRoutes, null, 2), 'utf8');
