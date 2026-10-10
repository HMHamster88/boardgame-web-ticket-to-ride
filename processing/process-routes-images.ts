import * as fs from 'fs';
import path from 'path';
import { transliterate } from 'transliteration';

const fieldName = 'USSR'

const fieldDir = './front/src/assets/fields/' + fieldName

import fieldData from "../back/src/fields/USSR.json" with { type: "json" };

const cityIds = new Set(fieldData.cities.map(city => city.id))

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
        const nameParts = file.split(/[_\\.]/)
        const from = nameParts[0]
        const to = nameParts[1]

        if (!cityIds.has(from)) {
            throw new Error(`Invalid from city id ${from}, ${file}`)
        }
        if (!cityIds.has(to)) {
            throw new Error(`Invalid to city id ${to}, ${file}`)
        }
        result.push({
            id: from.replaceAll('-', '_') + to.replaceAll('-', '_'),
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
    stream.write(`import ${transliterate(route.id)} from '../../assets/fields/${fieldName}/${route.isLong ? 'long-routes' : 'routes'}/${route.fileName}'\r\n`)
}

stream.write(`\r\nexport const RouteImages: Record<string, string> = {\r\n`)
for (let route of allRoutes) {
    stream.write(` '${route.id}': ${transliterate(route.id)},\r\n`)
}
stream.write(`}`);

allRoutes.forEach(route => route.fileName = undefined)
fs.writeFileSync('./processing/output/routes.json', JSON.stringify(allRoutes, null, 2), 'utf8');
