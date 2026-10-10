
import * as fs from 'fs';
import * as path from 'path';
import { type ElementNode, parse } from 'svg-parser';
import { CityData, FieldData, RailColor, RailData, RailPathData } from '../back/src/fields/fieldData'
import { compose, fromTransformAttribute, applyToPoint, fromDefinition } from 'transformation-matrix';
import { Size } from '../back/src/types/types';

const inputPath = path.resolve(path.join("processing", "input", "result.svg"))
const data = fs.readFileSync(inputPath, 'utf8');
const svg = parse(data).children[0] as ElementNode

interface Rect {
    x: number,
    y: number,
    width: number,
    height: number,
    transform: string
}

interface Point {
    x: number,
    y: number
}


function distance(a: Point, b: Point) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y))
}

function getRectCenterPoints(rect: Rect): Point[] {
    const points = [
        { x: rect.x, y: rect.y + rect.height / 2 },
        { x: rect.x + rect.width, y: rect.y + rect.height / 2 }
    ];

    if (!rect.transform) {
        return points
    }

    const matrix = compose(fromDefinition(fromTransformAttribute(rect.transform)))

    return points.map(point => {
        const transformedPoint = applyToPoint(matrix, point)
        return {
            x: transformedPoint.x,
            y: transformedPoint.y
        }
    });
}

function minDistancePoint(point: Point, points: Point[]): [number, Point] {
    let result: Point = points[0]
    let minDistance = Number.MAX_VALUE
    for (let p of points) {
        if (p != point) {
            const dist = distance(p, point)
            if (dist < minDistance) {
                minDistance = dist
                result = p
            }
        }
    }
    return [minDistance, result]
}

function reduceRailPoints(points: Point[]): Point[] {
    const result = [...points]
    while (result.length > 2) {
        const point1Distance = minDistancePoint(result[0], result)
        const point2Distance = minDistancePoint(result[1], result)
        if (point1Distance[0] < point2Distance[0]) {
            result.splice(0, 1)
            result.splice(result.indexOf(point1Distance[1]), 1)
        } else {
            result.splice(1, 1)
            result.splice(result.indexOf(point2Distance[1]), 1)
        }
    }
    return result
}

const cities: CityData[] = []
let cityRadius = 0

function getClosestCity(point: Point) {
    let minDistance = Number.MAX_VALUE
    let closestCity: CityData | undefined = undefined
    for (let city of cities) {

        const dist = distance(point, { x: city.cx, y: city.cy })
        if (dist < minDistance) {
            minDistance = dist
            closestCity = city
        }

    }
    return closestCity
}

let fieldSize: Size = { width: 0, height: 0 }

for (let children of svg.children) {
    const element = children as ElementNode
    if (element.properties) {
        if (element.tagName == 'circle') {
            const cityId = element.properties['id'] as string
            if (!cityId) {
                throw new Error('Circle without id')
            }
            cityRadius = element.properties['r'] as number
            cities.push({
                id: cityId,
                cx: element.properties['cx'] as number,
                cy: element.properties['cy'] as number,
            })
        } else if (element.tagName == 'image') {
            fieldSize = { width: element.properties['width'] as number, height: element.properties['height'] as number }
        }
    }
}


const railPaths: RailPathData[] = []
const railPathsIds: Set<string> = new Set<string>()
let rectSize: Size = { width: 0, height: 0 }

for (let children of svg.children) {
    const element = children as ElementNode
    if (element.tagName == 'g' && element.properties) {
        const rects: Rect[] = []
        const railDatas: RailData[] = []
        for (let groupChild of element.children) {
            const groupElement = groupChild as ElementNode
            if (groupElement.tagName == 'rect' && groupElement.properties) {
                const rect = {
                    x: groupElement.properties['x'] as number,
                    y: groupElement.properties['y'] as number,
                    width: groupElement.properties['width'] as number,
                    height: groupElement.properties['height'] as number,
                    transform: groupElement.properties['transform'] as string
                }
                rects.push(rect)
                railDatas.push({
                    x: rect.x,
                    y: rect.y,
                    transform: rect.transform
                })
                rectSize = { width: rect.width, height: rect.height }
            }
        }

        const rectsPoints = rects.flatMap(rect => getRectCenterPoints(rect))
        const railPoints = reduceRailPoints(rectsPoints)
        const from = getClosestCity(railPoints[0])!
        const to = getClosestCity(railPoints[1])!
        const groupId = element.properties['id'] as string
        const colorString = element.properties['color'] as string
        if (!colorString) {
            throw new Error(`No color for group '${groupId}'`)
        }
        if (!Object.values(RailColor).includes(colorString.toUpperCase() as RailColor)) {
            throw new Error(`Invalid color '${colorString}' for group '${groupId}'`)
        }
        const color = colorString.toUpperCase() as RailColor
        let id = `${from?.id}-${to?.id}-${color}`
        let idIndex = 1
        while (railPathsIds.has(id)) {
            id = `${from?.id}-${to?.id}-${color}-${idIndex}`
            idIndex++
        }
        const locoCount = element.properties['locomotiveCount'] as number || 0
        railPaths.push({
            id: id,
            from: from.id,
            to: to.id,
            color: color,
            isTunnel: Boolean(element.properties['isTunnel']),
            locomotiveCount: locoCount,
            rects: railDatas
        })
    } if (element.tagName == 'rect') {
        throw new Error('Ungrouped rect ')
    }

}

const fieldData: FieldData = {
    size: fieldSize,
    railPaths: railPaths,
    rectSize: rectSize,
    cities: cities,
    cityRadius: cityRadius,
    routes: []
}

console.log(`Rail paths ${railPaths.length}`)
console.log(`Cities ${cities.length}`)

fs.writeFileSync(path.resolve(path.join("processing", "output", "field.json")), JSON.stringify(fieldData, null, 2))

