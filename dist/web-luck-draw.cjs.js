'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class Lucky {
    constructor() {
        this.htmlFontSize = 16;
        this.dpr = 1;
        // 初始化一些公共设置
        this.setDpr();
        this.setHTMLFontSize();
    }
    /**
     * 设备像素比
     */
    setDpr() {
        window.dpr = this.dpr = (window.devicePixelRatio || 2) * 1.3;
    }
    /**
     * 根标签的字体大小
     */
    setHTMLFontSize() {
        this.htmlFontSize = +getComputedStyle(document.documentElement).fontSize.slice(0, -2);
    }
    /**
     * 根据 dpr 缩放 canvas 并处理位移
     * @param canvas 画布
     * @param width 将要等比缩放的宽
     * @param height 将要等比缩放的高
     */
    optimizeClarity(canvas, width, height) {
        const { dpr } = this;
        const compute = (len) => {
            return (len * dpr - len) / (len * dpr) * (dpr / 2) * 100;
        };
        canvas.style.transform = `scale(${1 / dpr}) translate(
      ${-compute(width)}%, ${-compute(height)}%
    )`;
    }
    /**
     * 转换单位
     * @param { string } value 将要转换的值
     * @param config
     * @return { number } 返回新的字符串
     */
    changeUnits(value, { denominator = 1, clean = false }) {
        return Number(value.replace(/^(\-*[0-9.]*)([a-z%]*)$/, (value, num, unit) => {
            switch (unit) {
                case '%':
                    num *= (denominator / 100);
                    break;
                case 'px':
                    num *= 1;
                    break;
                case 'rem':
                    num *= this.htmlFontSize;
                    break;
                default:
                    num *= 1;
                    break;
            }
            return clean || unit === '%' ? num : num * this.dpr;
        }));
    }
}

/**
 * 判断是否是期望的类型
 * @param { any } param 将要判断的变量
 * @param { ...string } types 期望的类型
 * @return { boolean } 返回期望是否正确
 */
const isExpectType = (param, ...types) => {
    return types.some(type => Object.prototype.toString.call(param).slice(8, -1).toLowerCase() === type);
};
/**
 * 移除\n
 * @param { string } str 将要处理的字符串
 * @return { string } 返回新的字符串
 */
const removeEnter = (str) => {
    return [].filter.call(str, s => s !== '\n').join('');
};
/**
 * 参数校验器
 * @param data 将要校验的参数
 * @param params 校验规则
 * @param msg 警告信息
 * @return { boolean } 校验成功返回true, 反之false
 */
// export const paramsValidator = (data: any, params = {}, msg = '') => {
//   if (isExpectType(data, 'object')) data = [data]
//   return data.every((item, index) => {
//     for (let key in params) {
//       if (params[key] === 1 && !item.hasOwnProperty(key)) {
//         return !!console.error(`参数 ${msg}[${index}] 缺少 ${key} 属性`)
//       }
//       else if (isExpectType(params[key], 'object') && item[key]) {
//         if (!paramsValidator(
//           item[key], params[key], msg ? `${msg}[${index}].${key}` : key
//         )) return false
//       }
//     }
//     return true
//   })
// }
/**
 * 通过padding计算
 * @return { object } block 边框信息
 */
const computePadding = (block) => {
    let padding = block.padding.replace(/px/g, '').split(' ').map(n => ~~n) || [0], paddingTop = 0, paddingBottom = 0, paddingLeft = 0, paddingRight = 0;
    switch (padding.length) {
        case 1:
            paddingTop = paddingBottom = paddingLeft = paddingRight = padding[0];
            break;
        case 2:
            paddingTop = paddingBottom = padding[0];
            paddingLeft = paddingRight = padding[1];
            break;
        case 3:
            paddingTop = padding[0];
            paddingLeft = paddingRight = padding[1];
            paddingBottom = padding[2];
            break;
        default:
            paddingTop = padding[0];
            paddingBottom = padding[1];
            paddingLeft = padding[2];
            paddingRight = padding[3];
    }
    // 检查是否单独传入值, 并且不是0
    const res = { paddingTop, paddingBottom, paddingLeft, paddingRight };
    for (let key in res) {
        // 是否含有这个属性, 并且是数字或字符串
        res[key] = block.hasOwnProperty(key) && isExpectType(block[key], 'string', 'number')
            ? ~~String(block[key]).replace(/px/g, '')
            : res[key];
    }
    return [paddingTop, paddingBottom, paddingLeft, paddingRight];
};

/**
 * 转换为运算角度
 * @param { number } deg 数学角度
 * @return { number } 运算角度
 */
const getAngle = (deg) => {
    return Math.PI / 180 * deg;
};
/**
 * 根据角度计算圆上的点
 * @param { number } deg 运算角度
 * @param { number } r 半径
 * @return { Array<number> } 坐标[x, y]
 */
const getArcPointerByDeg = (deg, r) => {
    return [+(Math.cos(deg) * r).toFixed(8), +(Math.sin(deg) * r).toFixed(8)];
};
/**
 * 根据点计算切线方程
 * @param { number } x 横坐标
 * @param { number } y 纵坐标
 * @return { Array<number> } [斜率, 常数]
 */
const getTangentByPointer = (x, y) => {
    let k = -x / y;
    let b = -k * x + y;
    return [k, b];
};
// 根据三点画圆弧
const drawRadian = (ctx, r, start, end, direction = true) => {
    if (Math.abs(end - start).toFixed(8) >= getAngle(180).toFixed(8)) {
        let middle = (end + start) / 2;
        if (direction) {
            drawRadian(ctx, r, start, middle, direction);
            drawRadian(ctx, r, middle, end, direction);
        }
        else {
            drawRadian(ctx, r, middle, end, direction);
            drawRadian(ctx, r, start, middle, direction);
        }
        return false;
    }
    if (!direction)
        [start, end] = [end, start];
    const [x1, y1] = getArcPointerByDeg(start, r);
    const [x2, y2] = getArcPointerByDeg(end, r);
    const [k1, b1] = getTangentByPointer(x1, y1);
    const [k2, b2] = getTangentByPointer(x2, y2);
    let x0 = (b2 - b1) / (k1 - k2);
    let y0 = (k2 * b1 - k1 * b2) / (k2 - k1);
    if (isNaN(x0)) {
        Math.abs(x1) === +r.toFixed(8) && (x0 = x1);
        Math.abs(x2) === +r.toFixed(8) && (x0 = x2);
    }
    if (k1 === Infinity || k1 === -Infinity) {
        y0 = k2 * x0 + b2;
    }
    else if (k2 === Infinity || k2 === -Infinity) {
        y0 = k1 * x0 + b1;
    }
    ctx.lineTo(x1, y1);
    ctx.arcTo(x0, y0, x2, y2, r);
};
// 绘制扇形
const drawSector = (ctx, minRadius, maxRadius, start, end, gutter, background) => {
    if (!minRadius)
        minRadius = gutter;
    let maxGutter = getAngle(90 / Math.PI / maxRadius * gutter);
    let minGutter = getAngle(90 / Math.PI / minRadius * gutter);
    let maxStart = start + maxGutter;
    let maxEnd = end - maxGutter;
    let minStart = start + minGutter;
    let minEnd = end - minGutter;
    ctx.beginPath();
    ctx.fillStyle = background;
    ctx.moveTo(...getArcPointerByDeg(maxStart, maxRadius));
    drawRadian(ctx, maxRadius, maxStart, maxEnd, true);
    // 如果 getter 比按钮短就绘制圆弧, 反之计算新的坐标点
    if (minEnd > minStart)
        drawRadian(ctx, minRadius, minStart, minEnd, false);
    else
        ctx.lineTo(...getArcPointerByDeg((start + end) / 2, gutter / 2 / Math.abs(Math.sin((start - end) / 2))));
    ctx.closePath();
    ctx.fill();
};
// 绘制圆角矩形
const drawRoundRect = (ctx, x, y, w, h, r, color) => {
    let min = Math.min(w, h);
    if (r > min / 2)
        r = min / 2;
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
};
/**
 * 创建线性渐变色
 */
const getLinearGradient = (ctx, x, y, w, h, background) => {
    const context = /linear-gradient\((.+)\)/.exec(background)[1]
        .split(',') // 根据逗号分割
        .map((text) => text.trim()); // 去除两边空格
    let deg = context.shift(), direction = [0, 0, 0, 0];
    // 通过起始点和角度计算渐变终点的坐标点, 这里感谢泽宇大神提醒我使用勾股定理....
    if (deg.includes('deg')) {
        deg = deg.slice(0, -3) % 360;
        // 根据4个象限定义起点坐标, 根据45度划分8个区域计算终点坐标
        const getLenOfTanDeg = (deg) => Math.tan(deg / 180 * Math.PI);
        if (deg >= 0 && deg < 45)
            direction = [x, y + h, x + w, y + h - w * getLenOfTanDeg(deg - 0)];
        else if (deg >= 45 && deg < 90)
            direction = [x, y + h, (x + w) - h * getLenOfTanDeg(deg - 45), y];
        else if (deg >= 90 && deg < 135)
            direction = [x + w, y + h, (x + w) - h * getLenOfTanDeg(deg - 90), y];
        else if (deg >= 135 && deg < 180)
            direction = [x + w, y + h, x, y + w * getLenOfTanDeg(deg - 135)];
        else if (deg >= 180 && deg < 225)
            direction = [x + w, y, x, y + w * getLenOfTanDeg(deg - 180)];
        else if (deg >= 225 && deg < 270)
            direction = [x + w, y, x + h * getLenOfTanDeg(deg - 225), y + h];
        else if (deg >= 270 && deg < 315)
            direction = [x, y, x + h * getLenOfTanDeg(deg - 270), y + h];
        else if (deg >= 315 && deg < 360)
            direction = [x, y, x + w, y + h - w * getLenOfTanDeg(deg - 315)];
    }
    // 创建四个简单的方向坐标
    else if (deg.includes('top'))
        direction = [x, y + h, x, y];
    else if (deg.includes('bottom'))
        direction = [x, y, x, y + h];
    else if (deg.includes('left'))
        direction = [x + w, y, x, y];
    else if (deg.includes('right'))
        direction = [x, y, x + w, y];
    // 创建线性渐变必须使用整数坐标
    const gradient = ctx.createLinearGradient(...direction.map(n => n >> 0));
    // 这里后期重构, 先用any代替
    return context.reduce((gradient, item, index) => {
        const info = item.split(' ');
        if (info.length === 1)
            gradient.addColorStop(index, info[0]);
        else if (info.length === 2)
            gradient.addColorStop(...info);
        return gradient;
    }, gradient);
};

/**
 * 缓动函数
 * t: current time（当前时间）
 * b: beginning value（初始值）
 * c: change in value（变化量）
 * d: duration（持续时间）
 *
 * 感谢张鑫旭大佬 https://github.com/zhangxinxu/Tween
 */
// 二次方的缓动
const quad = {
    easeIn: function (t, b, c, d) {
        if (t >= d)
            t = d;
        return c * (t /= d) * t + b;
    },
    easeOut: function (t, b, c, d) {
        if (t >= d)
            t = d;
        return -c * (t /= d) * (t - 2) + b;
    }
};

class LuckyWheel extends Lucky {
    /**
     * 大转盘构造器
     * @param el 元素标识
     * @param data 抽奖配置项
     */
    constructor(el, data = {}) {
        super();
        this.blocks = [];
        this.prizes = [];
        this.buttons = [];
        this.defaultConfig = {
            gutter: '0px',
            offsetDegree: 0,
            speed: 20,
            accelerationTime: 2500,
            decelerationTime: 2500,
        };
        this.defaultStyle = {
            fontSize: '18px',
            fontColor: '#000',
            fontStyle: 'microsoft yahei ui,microsoft yahei,simsun,sans-serif',
            fontWeight: '400',
            background: '#fff',
            wordWrap: true,
            lengthLimit: '90%',
        };
        this.Radius = 0; // 大转盘半径
        this.prizeRadius = 0; // 奖品区域半径
        this.prizeDeg = 0; // 奖品数学角度
        this.prizeRadian = 0; // 奖品运算角度
        this.rotateDeg = 0; // 转盘旋转角度
        this.maxBtnRadius = 0; // 最大按钮半径
        this.startTime = 0; // 开始时间戳
        this.endTime = 0; // 停止时间戳
        this.stopDeg = 0; // 刻舟求剑
        this.endDeg = 0; // 停止角度
        this.animationId = 0; // 帧动画id
        this.FPS = 16.6; // 屏幕刷新率
        this.prizeImgs = [[]];
        this.btnImgs = [[]];
        this.box = document.querySelector(el);
        this.canvas = document.createElement('canvas');
        this.box.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.setData(data);
        // 收集首次渲染的图片
        let willUpdate = [[]];
        this.prizes && (willUpdate = this.prizes.map(prize => prize.imgs));
        this.buttons && (willUpdate.push(...this.buttons.map(btn => btn.imgs)));
        this.init(willUpdate);
    }
    /**
     * 初始化数据
     * @param data
     */
    setData(data) {
        this.blocks = data.blocks || [];
        this.prizes = data.prizes || [];
        this.buttons = data.buttons || [];
        this.startCallback = data.start;
        this.endCallback = data.end;
        for (let key in data.defaultConfig) {
            this.defaultConfig[key] = data.defaultConfig[key];
        }
        for (let key in data.defaultStyle) {
            this.defaultStyle[key] = data.defaultStyle[key];
        }
    }
    /**
     * 初始化 canvas 抽奖
     * @param { Array<ImgType[]> } willUpdateImgs 需要更新的图片
     */
    init(willUpdateImgs) {
        this.setDpr();
        this.setHTMLFontSize();
        const { box, canvas, ctx, dpr } = this;
        if (!box)
            return;
        canvas.width = canvas.height = box.offsetWidth * dpr;
        this.Radius = canvas.width / 2;
        this.optimizeClarity(canvas, this.Radius * 2, this.Radius * 2);
        ctx.translate(this.Radius, this.Radius);
        const endCallBack = () => {
            // 开始绘制
            this.draw();
            // 防止多次绑定点击事件
            canvas.onclick = e => {
                ctx.beginPath();
                ctx.arc(0, 0, this.maxBtnRadius, 0, Math.PI * 2, false);
                if (!ctx.isPointInPath(e.offsetX, e.offsetY))
                    return;
                if (this.startTime)
                    return;
                this.startCallback?.(e);
            };
        };
        // 同步加载图片
        let num = 0, sum = 0;
        if (isExpectType(willUpdateImgs, 'array')) {
            this.draw(); // 先画一次防止闪烁, 因为加载图片是异步的
            willUpdateImgs.forEach((imgs, cellIndex) => {
                if (!imgs)
                    return false;
                imgs.forEach((imgInfo, imgIndex) => {
                    sum++;
                    this.loadAndCacheImg(cellIndex, imgIndex, () => {
                        num++;
                        if (sum === num)
                            endCallBack.call(this);
                    });
                });
            });
        }
        if (!sum)
            endCallBack.call(this);
    }
    /**
     * 单独加载某一张图片并计算其实际渲染宽高
     * @param { number } cellIndex 奖品索引
     * @param { number } imgIndex 奖品图片索引
     * @param { Function } callBack 图片加载完毕回调
     */
    loadAndCacheImg(cellIndex, imgIndex, callBack) {
        // 先判断index是奖品图片还是按钮图片, 并修正index的值
        const isPrize = cellIndex < this.prizes.length;
        const cellName = isPrize ? 'prizes' : 'buttons';
        const imgName = isPrize ? 'prizeImgs' : 'btnImgs';
        cellIndex = isPrize ? cellIndex : cellIndex - this.prizes.length;
        // 获取图片信息
        const cell = this[cellName][cellIndex];
        if (!cell || !cell.imgs)
            return;
        const imgInfo = cell.imgs[imgIndex];
        if (!imgInfo)
            return;
        // 创建图片
        let imgObj = new Image();
        if (!this[imgName][cellIndex])
            this[imgName][cellIndex] = [];
        // 创建缓存
        this[imgName][cellIndex][imgIndex] = imgObj;
        imgObj.src = imgInfo.src;
        imgObj.onload = () => callBack.call(this);
    }
    /**
     * 计算图片的渲染宽高
     * @param imgObj 图片标签元素
     * @param imgInfo 图片信息
     * @param computedWidth 宽度百分比
     * @param computedHeight 高度百分比
     * @return [渲染宽度, 渲染高度]
     */
    computedWidthAndHeight(imgObj, imgInfo, computedWidth, computedHeight) {
        // 根据配置的样式计算图片的真实宽高
        if (!imgInfo.width && !imgInfo.height) {
            // 如果没有配置宽高, 则使用图片本身的宽高
            return [imgObj.width, imgObj.height];
        }
        else if (imgInfo.width && !imgInfo.height) {
            // 如果只填写了宽度, 没填写高度
            let trueWidth = this.getWidth(imgInfo.width, computedWidth);
            // 那高度就随着宽度进行等比缩放
            return [trueWidth, imgObj.height * (trueWidth / imgObj.width)];
        }
        else if (!imgInfo.width && imgInfo.height) {
            // 如果只填写了宽度, 没填写高度
            let trueHeight = this.getHeight(imgInfo.height, computedHeight);
            // 那宽度就随着高度进行等比缩放
            return [imgObj.width * (trueHeight / imgObj.height), trueHeight];
        }
        // 如果宽度和高度都填写了, 就如实计算
        return [
            this.getWidth(imgInfo.width, computedWidth),
            this.getHeight(imgInfo.height, computedHeight)
        ];
    }
    /**
     * 开始绘制
     */
    draw() {
        const { ctx, dpr, defaultConfig, defaultStyle } = this;
        ctx.clearRect(-this.Radius, -this.Radius, this.Radius * 2, this.Radius * 2);
        // 绘制blocks边框
        this.prizeRadius = this.blocks.reduce((radius, block) => {
            ctx.beginPath();
            ctx.fillStyle = block.background;
            ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
            ctx.fill();
            return radius - this.getLength(block.padding.split(' ')[0]) * dpr;
        }, this.Radius);
        // 计算起始弧度
        this.prizeDeg = 360 / this.prizes.length;
        this.prizeRadian = getAngle(this.prizeDeg);
        let start = getAngle(-90 + this.rotateDeg + defaultConfig.offsetDegree);
        // 计算文字横坐标
        const getFontX = (line) => {
            return this.getOffsetX(ctx.measureText(line).width);
        };
        // 计算文字纵坐标
        const getFontY = (font, height, lineIndex) => {
            // 优先使用字体行高, 要么使用默认行高, 其次使用字体大小, 否则使用默认字体大小
            const lineHeight = font.lineHeight || defaultStyle.lineHeight || font.fontSize || defaultStyle.fontSize;
            return this.getHeight(font.top, height) + (lineIndex + 1) * this.getLength(lineHeight) * dpr;
        };
        ctx.save();
        // 绘制prizes奖品区域
        this.prizes.forEach((prize, prizeIndex) => {
            // 计算当前奖品区域中间坐标点
            let currMiddleDeg = start + prizeIndex * this.prizeRadian;
            // 奖品区域可见高度
            let prizeHeight = this.prizeRadius - this.maxBtnRadius;
            // 绘制背景
            drawSector(ctx, this.maxBtnRadius, this.prizeRadius, currMiddleDeg - this.prizeRadian / 2, currMiddleDeg + this.prizeRadian / 2, this.getLength(defaultConfig.gutter) * dpr, prize.background || defaultStyle.background || 'rgba(0, 0, 0, 0)');
            // 计算临时坐标并旋转文字
            let x = Math.cos(currMiddleDeg) * this.prizeRadius;
            let y = Math.sin(currMiddleDeg) * this.prizeRadius;
            ctx.translate(x, y);
            ctx.rotate(currMiddleDeg + getAngle(90));
            // 绘制图片
            prize.imgs && prize.imgs.forEach((imgInfo, imgIndex) => {
                if (!this.prizeImgs[prizeIndex])
                    return;
                const prizeImg = this.prizeImgs[prizeIndex][imgIndex];
                if (!prizeImg)
                    return;
                const [trueWidth, trueHeight] = this.computedWidthAndHeight(prizeImg, imgInfo, this.prizeRadian * this.prizeRadius, prizeHeight);
                ctx.drawImage(prizeImg, this.getOffsetX(trueWidth), this.getHeight(imgInfo.top, prizeHeight), trueWidth, trueHeight);
            });
            // 逐行绘制文字
            prize.fonts && prize.fonts.forEach(font => {
                let fontColor = font.fontColor || defaultStyle.fontColor;
                let fontWeight = font.fontWeight || defaultStyle.fontWeight;
                let fontSize = this.getLength(font.fontSize || defaultStyle.fontSize);
                let fontStyle = font.fontStyle || defaultStyle.fontStyle;
                ctx.fillStyle = fontColor;
                ctx.font = `${fontWeight} ${fontSize * dpr}px ${fontStyle}`;
                let lines = [], text = String(font.text);
                if (font.hasOwnProperty('wordWrap') ? font.wordWrap : defaultStyle.wordWrap) {
                    text = removeEnter(text);
                    let str = '';
                    for (let i = 0; i < text.length; i++) {
                        str += text[i];
                        let currWidth = ctx.measureText(str).width;
                        let maxWidth = (this.prizeRadius - getFontY(font, prizeHeight, lines.length))
                            * Math.tan(this.prizeRadian / 2) * 2 - this.getLength(defaultConfig.gutter) * dpr;
                        if (currWidth > this.getWidth(font.lengthLimit || defaultStyle.lengthLimit, maxWidth)) {
                            lines.push(str.slice(0, -1));
                            str = text[i];
                        }
                    }
                    if (str)
                        lines.push(str);
                    if (!lines.length)
                        lines.push(text);
                }
                else {
                    lines = text.split('\n');
                }
                lines.filter(line => !!line).forEach((line, lineIndex) => {
                    ctx.fillText(line, getFontX(line), getFontY(font, prizeHeight, lineIndex));
                });
            });
            // 修正旋转角度和原点坐标
            ctx.rotate(getAngle(360) - currMiddleDeg - getAngle(90));
            ctx.translate(-x, -y);
        });
        ctx.restore();
        // 绘制按钮
        this.buttons.forEach((btn, btnIndex) => {
            let radius = this.getHeight(btn.radius);
            // 绘制背景颜色
            this.maxBtnRadius = Math.max(this.maxBtnRadius, radius);
            ctx.beginPath();
            ctx.fillStyle = btn.background || 'rgba(0, 0, 0, 0)';
            ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
            ctx.fill();
            // 绘制指针
            if (btn.pointer) {
                ctx.beginPath();
                ctx.fillStyle = btn.background || 'rgba(0, 0, 0, 0)';
                ctx.moveTo(-radius, 0);
                ctx.lineTo(radius, 0);
                ctx.lineTo(0, -radius * 2);
                ctx.closePath();
                ctx.fill();
            }
            // 绘制按钮图片
            btn.imgs && btn.imgs.forEach((imgInfo, imgIndex) => {
                if (!this.btnImgs[btnIndex])
                    return;
                const btnImg = this.btnImgs[btnIndex][imgIndex];
                if (!btnImg)
                    return;
                // 计算图片真实宽高
                const [trueWidth, trueHeight] = this.computedWidthAndHeight(btnImg, imgInfo, this.getHeight(btn.radius) * 2, this.getHeight(btn.radius) * 2);
                // 绘制图片
                ctx.drawImage(btnImg, this.getOffsetX(trueWidth), this.getHeight(imgInfo.top, radius), trueWidth, trueHeight);
            });
            // 绘制按钮文字
            btn.fonts && btn.fonts.forEach(font => {
                let fontColor = font.fontColor || defaultStyle.fontColor;
                let fontWeight = font.fontWeight || defaultStyle.fontWeight;
                let fontSize = this.getLength(font.fontSize || defaultStyle.fontSize);
                let fontStyle = font.fontStyle || defaultStyle.fontStyle;
                ctx.fillStyle = fontColor;
                ctx.font = `${fontWeight} ${fontSize * dpr}px ${fontStyle}`;
                String(font.text).split('\n').forEach((line, lineIndex) => {
                    ctx.fillText(line, getFontX(line), getFontY(font, radius, lineIndex));
                });
            });
        });
    }
    /**
     * 对外暴露: 开始抽奖方法
     */
    play() {
        // 再次拦截, 因为play是可以异步调用的
        if (this.startTime)
            return;
        cancelAnimationFrame(this.animationId);
        this.startTime = Date.now();
        this.prizeFlag = undefined;
        this.run();
    }
    /**
     * 对外暴露: 缓慢停止方法
     * @param index 中奖索引
     */
    stop(index) {
        this.prizeFlag = Number(index) % this.prizes.length;
    }
    /**
     * 实际开始执行方法
     * @param num 记录帧动画执行多少次
     */
    run(num = 0) {
        const { prizeFlag, prizeDeg, rotateDeg, defaultConfig } = this;
        let interval = Date.now() - this.startTime;
        // 先完全旋转, 再停止
        if (interval >= defaultConfig.accelerationTime && prizeFlag !== undefined) {
            // 记录帧率
            this.FPS = interval / num;
            // 记录开始停止的时间戳
            this.endTime = Date.now();
            // 记录开始停止的位置
            this.stopDeg = rotateDeg;
            // 最终停止的角度
            this.endDeg = 360 * 5 - prizeFlag * prizeDeg - rotateDeg - defaultConfig.offsetDegree;
            cancelAnimationFrame(this.animationId);
            return this.slowDown();
        }
        this.rotateDeg = (rotateDeg + quad.easeIn(interval, 0, defaultConfig.speed, defaultConfig.accelerationTime)) % 360;
        this.draw();
        this.animationId = window.requestAnimationFrame(this.run.bind(this, num + 1));
    }
    /**
     * 缓慢停止的方法
     */
    slowDown() {
        const { prizes, prizeFlag, stopDeg, endDeg, defaultConfig } = this;
        let interval = Date.now() - this.endTime;
        if (interval >= defaultConfig.decelerationTime) {
            this.startTime = 0;
            this.endCallback?.({ ...prizes.find((prize, index) => index === prizeFlag) });
            return cancelAnimationFrame(this.animationId);
        }
        this.rotateDeg = quad.easeOut(interval, stopDeg, endDeg, defaultConfig.decelerationTime) % 360;
        this.draw();
        this.animationId = window.requestAnimationFrame(this.slowDown.bind(this));
    }
    /**
     * 获取长度
     * @param length 将要转换的长度
     * @return 返回长度
     */
    getLength(length) {
        if (isExpectType(length, 'number'))
            return length;
        if (isExpectType(length, 'string'))
            return this.changeUnits(length, { clean: true });
        return 0;
    }
    /**
     * 获取相对宽度
     * @param length 将要转换的宽度
     * @param width 宽度计算百分比
     * @return 返回相对宽度
     */
    getWidth(length, width = this.prizeRadian * this.prizeRadius) {
        if (isExpectType(length, 'number'))
            return length * this.dpr;
        if (isExpectType(length, 'string'))
            return this.changeUnits(length, { denominator: width });
        return 0;
    }
    /**
     * 获取相对高度
     * @param length 将要转换的高度
     * @param height 高度计算百分比
     * @return 返回相对高度
     */
    getHeight(length, height = this.prizeRadius) {
        if (isExpectType(length, 'number'))
            return length * this.dpr;
        if (isExpectType(length, 'string'))
            return this.changeUnits(length, { denominator: height });
        return 0;
    }
    /**
     * 获取相对(居中)X坐标
     * @param width
     * @return 返回x坐标
     */
    getOffsetX(width) {
        return -width / 2;
    }
}

class LuckyGrid extends Lucky {
    /**
     * 九宫格构造器
     * @param el 元素标识
     * @param data 抽奖配置项
     */
    constructor(el, data = {}) {
        super();
        this.rows = 3;
        this.cols = 3;
        this.blocks = [];
        this.prizes = [];
        this.defaultConfig = {
            gutter: 5,
            speed: 20,
            accelerationTime: 2500,
            decelerationTime: 2500,
        };
        this.defaultStyle = {
            borderRadius: 20,
            fontColor: '#000',
            fontSize: '18px',
            fontStyle: 'microsoft yahei ui,microsoft yahei,simsun,sans-serif',
            fontWeight: '400',
            background: '#fff',
            shadow: '',
            wordWrap: true,
            lengthLimit: '90%',
        };
        this.activeStyle = {
            background: '#ffce98',
            shadow: '',
        };
        this.boxWidth = 0; // 九宫格宽度
        this.boxHeight = 0; // 九宫格高度
        this.cellWidth = 0; // 格子宽度
        this.cellHeight = 0; // 格子高度
        this.startTime = 0; // 开始时间戳
        this.endTime = 0; // 结束时间戳
        this.currIndex = 0; // 当前index累加
        this.stopIndex = 0; // 刻舟求剑
        this.endIndex = 0; // 停止索引
        this.demo = false; // 是否自动游走
        this.timer = 0; // 游走定时器
        this.animationId = 0; // 帧动画id
        this.FPS = 16.6; // 屏幕刷新率
        // 所有格子
        this.cells = [];
        // 图片缓存
        this.cellImgs = [];
        // 边框绘制信息
        this.blockData = [];
        this.box = document.querySelector(el);
        this.canvas = document.createElement('canvas');
        this.box.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.setData(data);
        // 收集首次渲染的图片
        let willUpdate = [[]];
        this.prizes && (willUpdate = this.prizes.map(prize => prize.imgs));
        this.button && (willUpdate[this.cols * this.rows - 1] = this.button.imgs);
        this.init(willUpdate);
    }
    /**
     * 初始化数据
     * @param data
     */
    setData(data) {
        this.rows = Number(data.rows) || 3;
        this.cols = Number(data.cols) || 3;
        this.blocks = data.blocks || [];
        this.prizes = data.prizes || [];
        this.button = data.button;
        this.startCallback = data.start;
        this.endCallback = data.end;
        const config = this.defaultConfig;
        const style = this.defaultStyle;
        const active = this.activeStyle;
        for (let key in data.defaultConfig) {
            config[key] = data.defaultConfig[key];
        }
        config.gutter = this.getLength(config.gutter) * this.dpr;
        config.speed /= 40;
        for (let key in data.defaultStyle) {
            style[key] = data.defaultStyle[key];
        }
        style.borderRadius = this.getLength(style.borderRadius) * this.dpr;
        for (let key in data.activeStyle) {
            active[key] = data.activeStyle[key];
        }
    }
    /**
     * 初始化 canvas 抽奖
     * @param willUpdateImgs 需要更新的图片
     */
    init(willUpdateImgs) {
        this.setDpr();
        this.setHTMLFontSize();
        const { box, canvas, dpr, defaultStyle, defaultConfig } = this;
        if (!box)
            return;
        this.boxWidth = canvas.width = box.offsetWidth * dpr;
        this.boxHeight = canvas.height = box.offsetHeight * dpr;
        this.optimizeClarity(canvas, this.boxWidth, this.boxHeight);
        // 合并奖品和按钮一起渲染
        this.cells = [...this.prizes];
        if (this.button)
            this.cells[this.cols * this.rows - 1] = { ...this.button };
        this.cells.forEach(cell => {
            cell.col = cell.col || 1;
            cell.row = cell.row || 1;
        });
        // 计算所有边框信息, 并获取奖品区域
        this.blockData = [];
        this.prizeArea = this.blocks.reduce(({ x, y, w, h }, block) => {
            const [paddingTop, paddingBottom, paddingLeft, paddingRight] = computePadding(block).map(n => n * dpr);
            this.blockData.push([x, y, w, h, block.borderRadius ? this.getLength(block.borderRadius) * dpr : 0, block.background]);
            return {
                x: x + paddingLeft,
                y: y + paddingTop,
                w: w - paddingLeft - paddingRight,
                h: h - paddingTop - paddingBottom
            };
        }, { x: 0, y: 0, w: this.boxWidth, h: this.boxHeight });
        // 计算单一奖品格子的宽度和高度
        this.cellWidth = (this.prizeArea.w - defaultConfig.gutter * (this.cols - 1)) / this.cols;
        this.cellHeight = (this.prizeArea.h - defaultConfig.gutter * (this.rows - 1)) / this.rows;
        const endCallBack = () => {
            // 开始首次渲染
            this.draw();
            // 中奖标识开始游走
            this.demo && this.walk();
            // 点击按钮开始, 这里不能使用 addEventListener
            if (this.button)
                canvas.onclick = e => {
                    const [x, y, width, height] = this.getGeometricProperty([
                        this.button.x,
                        this.button.y,
                        this.button.col || 1,
                        this.button.row || 1
                    ]);
                    if (e.offsetX < x || e.offsetY < y || e.offsetX > x + width || e.offsetY > y + height)
                        return false;
                    if (this.startTime)
                        return;
                    this.startCallback?.(e);
                };
        };
        // 同步加载图片
        let num = 0, sum = 0;
        if (isExpectType(willUpdateImgs, 'array')) {
            this.draw(); // 先画一次防止闪烁, 因为加载图片是异步的
            willUpdateImgs.forEach((imgs, cellIndex) => {
                if (!imgs)
                    return false;
                imgs.forEach((imgInfo, imgIndex) => {
                    sum++;
                    this.loadAndCacheImg(cellIndex, imgIndex, () => {
                        num++;
                        if (sum === num)
                            endCallBack.call(this);
                    });
                });
            });
        }
        if (!sum)
            endCallBack.call(this);
    }
    /**
     * 单独加载某一张图片并计算其实际渲染宽高
     * @param { number } prizeIndex 奖品索引
     * @param { number } imgIndex 奖品图片索引
     * @param { Function } callBack 图片加载完毕回调
     */
    loadAndCacheImg(prizeIndex, imgIndex, callBack) {
        const prize = this.cells[prizeIndex];
        if (!prize || !prize.imgs)
            return;
        const imgInfo = prize.imgs[imgIndex];
        if (!this.cellImgs[prizeIndex])
            this.cellImgs[prizeIndex] = [];
        // 加载 defaultImg 默认图片
        let defaultImg = new Image();
        this.cellImgs[prizeIndex][imgIndex] = { defaultImg };
        defaultImg.src = imgInfo.src;
        let num = 0, sum = 1;
        defaultImg.onload = () => {
            num++;
            num === sum && callBack.call(this);
        };
        // 如果有 activeImg 则多加载一张
        if (!imgInfo.hasOwnProperty('activeSrc'))
            return;
        sum++;
        let activeImg = new Image();
        this.cellImgs[prizeIndex][imgIndex].activeImg = activeImg;
        activeImg.src = imgInfo.activeSrc;
        activeImg.onload = () => {
            num++;
            num === sum && callBack.call(this);
        };
    }
    /**
     * 计算图片的渲染宽高
     * @param imgObj 图片标签元素
     * @param imgInfo 图片信息
     * @param cell 格子信息
     * @return [渲染宽度, 渲染高度]
     */
    computedWidthAndHeight(imgObj, imgInfo, cell) {
        // 根据配置的样式计算图片的真实宽高
        if (!imgInfo.width && !imgInfo.height) {
            // 如果没有配置宽高, 则使用图片本身的宽高
            return [imgObj.width, imgObj.height];
        }
        else if (imgInfo.width && !imgInfo.height) {
            // 如果只填写了宽度, 没填写高度
            let trueWidth = this.getWidth(imgInfo.width, cell.col);
            // 那高度就随着宽度进行等比缩放
            return [trueWidth, imgObj.height * (trueWidth / imgObj.width)];
        }
        else if (!imgInfo.width && imgInfo.height) {
            // 如果只填写了宽度, 没填写高度
            let trueHeight = this.getHeight(imgInfo.height, cell.row);
            // 那宽度就随着高度进行等比缩放
            return [imgObj.width * (trueHeight / imgObj.height), trueHeight];
        }
        // 如果宽度和高度都填写了, 就分别计算
        return [
            this.getWidth(imgInfo.width, cell.col),
            this.getHeight(imgInfo.height, cell.row)
        ];
    }
    /**
     * 绘制九宫格抽奖
     */
    draw() {
        const { ctx, dpr, defaultStyle, activeStyle } = this;
        // 清空画布
        ctx.clearRect(0, 0, this.boxWidth, this.boxWidth);
        // 绘制所有边框
        this.blockData.forEach(([x, y, w, h, r, background]) => {
            drawRoundRect(ctx, x, y, w, h, r, this.handleBackground(x, y, w, h, background));
        });
        // 绘制所有格子
        this.cells.forEach((prize, cellIndex) => {
            let [x, y, width, height] = this.getGeometricProperty([prize.x, prize.y, prize.col, prize.row]);
            const isActive = cellIndex === this.currIndex % this.prizes.length >> 0;
            // 处理阴影 (暂时先用any, 这里后续要优化)
            const shadow = (isActive ? activeStyle.shadow : (prize.shadow || defaultStyle.shadow))
                .replace(/px/g, '') // 清空px字符串
                .split(',')[0].split(' ') // 防止有人声明多个阴影, 截取第一个阴影
                .map((n, i) => i < 3 ? Number(n) * dpr : n); // 把数组的前三个值*像素比
            // 绘制阴影
            if (shadow.length === 4) {
                ctx.shadowColor = shadow[3];
                ctx.shadowOffsetX = shadow[0];
                ctx.shadowOffsetY = shadow[1];
                ctx.shadowBlur = shadow[2];
                // 修正(格子+阴影)的位置, 这里使用逗号运算符
                shadow[0] > 0 ? (width -= shadow[0]) : (width += shadow[0], x -= shadow[0]);
                shadow[1] > 0 ? (height -= shadow[1]) : (height += shadow[1], y -= shadow[1]);
            }
            drawRoundRect(ctx, x, y, width, height, prize.borderRadius ? this.getLength(prize.borderRadius) * dpr : this.getLength(defaultStyle.borderRadius), this.handleBackground(x, y, width, height, prize.background, isActive));
            // 清空阴影
            ctx.shadowColor = 'rgba(255, 255, 255, 0)';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.shadowBlur = 0;
            // 绘制图片
            prize.imgs && prize.imgs.forEach((imgInfo, imgIndex) => {
                if (!this.cellImgs[cellIndex])
                    return false;
                const cellImg = this.cellImgs[cellIndex][imgIndex];
                if (!cellImg)
                    return false;
                const renderImg = (isActive && cellImg.activeImg) || cellImg.defaultImg;
                const [trueWidth, trueHeight] = this.computedWidthAndHeight(renderImg, imgInfo, prize);
                ctx.drawImage(renderImg, x + this.getOffsetX(trueWidth, prize.col), y + this.getHeight(imgInfo.top, prize.row), trueWidth, trueHeight);
            });
            // 绘制文字
            prize.fonts && prize.fonts.forEach(font => {
                // 字体样式
                let style = isActive && activeStyle.fontStyle
                    ? activeStyle.fontStyle
                    : (font.fontStyle || defaultStyle.fontStyle);
                // 字体加粗
                let fontWeight = isActive && activeStyle.fontWeight
                    ? activeStyle.fontWeight
                    : (font.fontWeight || defaultStyle.fontWeight);
                // 字体大小
                let size = isActive && activeStyle.fontSize
                    ? this.getLength(activeStyle.fontSize)
                    : this.getLength(font.fontSize || defaultStyle.fontSize);
                // 字体行高
                const lineHeight = isActive && activeStyle.lineHeight
                    ? activeStyle.lineHeight
                    : font.lineHeight || defaultStyle.lineHeight || font.fontSize || defaultStyle.fontSize;
                ctx.font = `${fontWeight} ${size * dpr}px ${style}`;
                ctx.fillStyle = (isActive && activeStyle.fontColor) ? activeStyle.fontColor : (font.fontColor || defaultStyle.fontColor);
                let lines = [], text = String(font.text);
                // 计算文字换行
                if (font.hasOwnProperty('wordWrap') ? font.wordWrap : defaultStyle.wordWrap) {
                    text = removeEnter(text);
                    let str = '';
                    for (let i = 0; i < text.length; i++) {
                        str += text[i];
                        let currWidth = ctx.measureText(str).width;
                        let maxWidth = this.getWidth(font.lengthLimit || defaultStyle.lengthLimit, prize.col);
                        if (currWidth > maxWidth) {
                            lines.push(str.slice(0, -1));
                            str = text[i];
                        }
                    }
                    if (str)
                        lines.push(str);
                    if (!lines.length)
                        lines.push(text);
                }
                else {
                    lines = text.split('\n');
                }
                lines.forEach((line, lineIndex) => {
                    ctx.fillText(line, x + this.getOffsetX(ctx.measureText(line).width, prize.col), y + this.getHeight(font.top, prize.row) + (lineIndex + 1) * this.getLength(lineHeight) * dpr);
                });
            });
        });
    }
    /**
     * 处理背景色
     * @param x
     * @param y
     * @param width
     * @param height
     * @param background
     * @param isActive
     */
    handleBackground(x, y, width, height, background, isActive = false) {
        const { ctx, defaultStyle, activeStyle } = this;
        background = isActive ? activeStyle.background : (background || defaultStyle.background);
        // 处理线性渐变
        if (background.includes('linear-gradient')) {
            background = getLinearGradient(ctx, x, y, width, height, background);
        }
        return background;
    }
    /**
     * 对外暴露: 开始抽奖方法
     */
    play() {
        if (this.startTime)
            return;
        clearInterval(this.timer);
        cancelAnimationFrame(this.animationId);
        this.startTime = Date.now();
        this.prizeFlag = undefined;
        this.run();
    }
    /**
     * 对外暴露: 缓慢停止方法
     * @param index 中奖索引
     */
    stop(index) {
        this.prizeFlag = index % this.prizes.length;
    }
    /**
     * 实际开始执行方法
     * @param num 记录帧动画执行多少次
     */
    run(num = 0) {
        const { currIndex, prizes, prizeFlag, startTime, defaultConfig } = this;
        let interval = Date.now() - startTime;
        // 先完全旋转, 再停止
        if (interval >= defaultConfig.accelerationTime && prizeFlag !== undefined) {
            // 记录帧率
            this.FPS = interval / num;
            // 记录开始停止的时间戳
            this.endTime = Date.now();
            // 记录开始停止的索引
            this.stopIndex = currIndex;
            // 最终停止的索引
            this.endIndex = prizes.length * 5 + prizeFlag - (currIndex >> 0);
            cancelAnimationFrame(this.animationId);
            return this.slowDown();
        }
        this.currIndex = (currIndex + quad.easeIn(interval, 0.1, defaultConfig.speed, defaultConfig.accelerationTime)) % prizes.length;
        this.draw();
        this.animationId = window.requestAnimationFrame(this.run.bind(this, num + 1));
    }
    /**
     * 缓慢停止的方法
     */
    slowDown() {
        const { prizes, prizeFlag, stopIndex, endIndex, defaultConfig } = this;
        let interval = Date.now() - this.endTime;
        if (interval > defaultConfig.decelerationTime) {
            this.startTime = 0;
            this.endCallback?.({ ...prizes.find((prize, index) => index === prizeFlag) });
            return cancelAnimationFrame(this.animationId);
        }
        this.currIndex = quad.easeOut(interval, stopIndex, endIndex, defaultConfig.decelerationTime) % prizes.length;
        this.draw();
        this.animationId = window.requestAnimationFrame(this.slowDown.bind(this));
    }
    /**
     * 开启中奖标识自动游走
     */
    walk() {
        clearInterval(this.timer);
        this.timer = window.setInterval(() => {
            this.currIndex += 1;
            this.draw();
        }, 1300);
    }
    /**
     * 计算奖品格子的几何属性
     * @param { array } [...矩阵坐标, col, row]
     * @return { array } [...真实坐标, width, height]
     */
    getGeometricProperty([x, y, col, row]) {
        const { defaultConfig, cellWidth, cellHeight } = this;
        let res = [
            this.prizeArea.x + (cellWidth + defaultConfig.gutter) * x,
            this.prizeArea.y + (cellHeight + defaultConfig.gutter) * y
        ];
        col && row && res.push(cellWidth * col + defaultConfig.gutter * (col - 1), cellHeight * row + defaultConfig.gutter * (row - 1));
        return res;
    }
    /**
     * 获取长度
     * @param length 将要转换的长度
     * @return 返回长度
     */
    getLength(length) {
        if (isExpectType(length, 'number'))
            return length;
        if (isExpectType(length, 'string'))
            return this.changeUnits(length, { clean: true });
        return 0;
    }
    /**
     * 转换并获取宽度
     * @param width 将要转换的宽度
     * @param col 横向合并的格子
     * @return 返回相对宽度
     */
    getWidth(width, col = 1) {
        if (isExpectType(width, 'number'))
            return width * this.dpr;
        if (isExpectType(width, 'string'))
            return this.changeUnits(width, { denominator: this.cellWidth * col + this.defaultConfig.gutter * (col - 1) });
        return 0;
    }
    /**
     * 转换并获取高度
     * @param height 将要转换的高度
     * @param row 纵向合并的格子
     * @return 返回相对高度
     */
    getHeight(height, row = 1) {
        if (isExpectType(height, 'number'))
            return height * this.dpr;
        if (isExpectType(height, 'string'))
            return this.changeUnits(height, { denominator: this.cellHeight * row + this.defaultConfig.gutter * (row - 1) });
        return 0;
    }
    /**
     * 获取相对(居中)X坐标
     * @param width
     * @param col
     */
    getOffsetX(width, col = 1) {
        return (this.cellWidth * col + this.defaultConfig.gutter * (col - 1) - width) / 2;
    }
}

exports.LuckyGrid = LuckyGrid;
exports.LuckyWheel = LuckyWheel;
