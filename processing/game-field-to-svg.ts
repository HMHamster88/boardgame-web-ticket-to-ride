import * as fs from 'fs';
import * as path from 'path';
import cv from 'opencv-ts';
import { Jimp } from 'jimp'; // Импортируем Jimp для чтения картинок в Node.js

const resizeRect = true;

interface Size {
    width: number
    height: number
}

const rectResizeWidth = 195;
const rectResizeHeight = 56;

const rectTolerance = 0.3
const targetRectSize: Size = { width: 204, height: 59 }

const imagePath = path.resolve(path.join("processing", "input", "game-field.png"));
const outputPath = path.join("processing", "output", "result.svg");

function checkTolerance(toCheck: number, target: number, tolerance: number) {
    return toCheck > target * (1 - tolerance) && toCheck < target * (1 + tolerance)
}

function checkRectSize(toCheck: Size, target: Size, tolerance: number) {
    let width = toCheck.width
    let height = toCheck.height
    if (width < height) {
        let tmp = width
        width = height
        height = tmp
    }
    return checkTolerance(width, target.width, tolerance) && checkTolerance(height, target.height, tolerance)
}

async function run() {
    console.log('Start')
    // 1. Загружаем изображение с помощью Jimp без использования браузерного API
    const jimpImage = await Jimp.read(imagePath);
    const w = jimpImage.bitmap.width;
    const h = jimpImage.bitmap.height;

    const imageData = {
        data: jimpImage.bitmap.data,
        width: w,
        height: h,
        colorSpace: 'srgb' as const
    } as unknown as ImageData;

    // Создаем матрицу OpenCV из сырых пикселей
    const imageRGBA = cv.matFromImageData(imageData);

    // Переводим из RGBA в BGR, чтобы дальнейший код работал стандартно для OpenCV
    const image = new cv.Mat();
    cv.cvtColor(imageRGBA, image, cv.COLOR_RGBA2BGR);

    // Сразу освобождаем временную RGBA матрицу
    imageRGBA.delete();

    // 2. Image processing & contour detection
    const gray = new cv.Mat();
    cv.cvtColor(image, gray, cv.COLOR_BGR2GRAY);

    const blurred = new cv.Mat();
    const ksize = new cv.Size(5, 5);
    cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);

    const edged = new cv.Mat();
    cv.Canny(blurred, edged, 50, 150);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edged, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const svgElements: string[] = [];


    for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);

        const peri = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.04 * peri, true);

        const area = cv.contourArea(contour, false);

        if (true) { //area > minArea && area < maxArea) {
            const rect = cv.minAreaRect(contour);
            let cx = rect.center.x;
            let cy = rect.center.y;
            let width = rect.size.width;
            let height = rect.size.height;
            let angle = rect.angle;

            if (checkRectSize({ width: width, height: height }, targetRectSize, rectTolerance)) {
                console.log('Pass')
                if (resizeRect) {
                    if (height > width) {
                        angle += 90;
                    }
                    width = rectResizeWidth;
                    height = rectResizeHeight;
                }

                const topLeftX = cx - (width / 2);
                const topLeftY = cy - (height / 2);

                const svgRect = `<rect x="${topLeftX}" y="${topLeftY}" width="${width}" height="${height}" ` +
                    `stroke="lime" stroke-width="2" fill="red" fill-opacity="0.5" ` +
                    `transform="rotate(${angle}, ${cx}, ${cy})" />`;

                svgElements.push(svgRect);
            }
        }

        approx.delete();
    }

    // Сборка SVG файла
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <image href="${imagePath}" x="0" y="0" width="${w}" height="${h}" />
    ${svgElements.join('\n    ')}
</svg>
`.trim();

    // Сохранение SVG
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, svgContent, 'utf-8');

    console.log("SVG file saved successfully as 'result.svg'!");

    // Очистка памяти WebAssembly кучи
    image.delete();
    gray.delete();
    blurred.delete();
    edged.delete();
    contours.delete();
    hierarchy.delete();
}

run().catch(err => {
    console.error("Ошибка при обработке изображения:", err);
});
