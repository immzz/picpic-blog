const { launchBrowser } = require("./__utils__/browser_utils");
const devices = require("puppeteer/DeviceDescriptors");
const { Page } = require("puppeteer/lib/Page");

jest.setTimeout(120000);

let clientX;
let clientY;

describe("Post walkthrough", () => {
  /** @type {Page} */
  let page;
  let browser;
  let client;
  let keyboard;
  beforeAll(async () => {
    browser = await launchBrowser();
  }, 10000);

  beforeEach(async () => {
    page = await browser.newPage();
    client = await page.target().createCDPSession();
    keyboard = page.keyboard;
    const device = getRandomDevice();
    // console.log(`Emulating ${device.name}`)
    await page.emulate(device);
  }, 10000);

  afterEach(async () => {
    if (page) {
      await page.close();
      page = null;
    }
  }, 30000);

  afterAll(async () => {
    await browser.close();
  });

  it("should display a single post correctly", async () => {
    await page.setExtraHTTPHeaders({
      "cache-control": "no-cache",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
    });

    await page.goto("https://blog.picpiclive.com", {
      timeout: 10000,
      waitUntil: ["domcontentloaded", "load"]
    });

    await page.waitFor(getRandomInt(2000, 6000));

    // Goto post.
    const postContainers = await page.$$(".post-container");
    expect(postContainers.length).toBeGreaterThan(0);

    const pickedPostIndex = getRandomInt(0, 4);
    console.log(`Picked post ${pickedPostIndex}`);
    const pickedPost = postContainers[pickedPostIndex];

    const pickedPostOffset = await page.evaluate(
      element => element.offsetTop,
      pickedPost
    );
    console.log(`Picked post offset ${pickedPostOffset}`);

    await moveByDelta(page, client, keyboard, 0, pickedPostOffset - 100, -1);
    const title = await pickedPost.$("h3 a");
    expect(title).toBeDefined();
    await tapOnElement(page, title);
    await page.waitFor(getRandomInt(6000, 9000));

    // Scroll to read.
    const delta = await page.$eval(".adsbygoogle", item => item.offsetTop);
    const windowInnerHeight = await page.evaluate(() => window.innerHeight);
    const targetScrollY = delta + 300 - windowInnerHeight;

    let direction = 1;
    const initialScrollY = await page.evaluate(() => window.scrollY);
    let scrollY = initialScrollY;
    let prevScrollY = scrollY;
    await moveByDelta(page, client, keyboard, 0, 100, direction);
    scrollY = await page.evaluate(() => window.scrollY);
    if (scrollY <= initialScrollY) {
      console.log("Change touch move direction");
      direction *= -1;
    }
    console.log(delta - scrollY);
    while (true) {
      await moveByDelta(
        page,
        client,
        keyboard,
        0,
        (targetScrollY - scrollY) / 2,
        direction
      );
      prevScrollY = scrollY;
      scrollY = await page.evaluate(() => window.scrollY);
      if (Math.abs(scrollY - prevScrollY) < 10) {
        // Barely moving.
        break;
      }
      await page.waitFor(getRandomInt(500, 4000));
    }

    // const prob = 1;
    const prob = Math.random() * 0.2 + 0.1;
    console.log(`Draw with probability ${prob}`);
    if (drawFromProbability(prob)) {
      const adsbygoogle = await page.$(".adsbygoogle");
      // await tapOnElement(page, adsbygoogle);
      await tapOnElement(page, adsbygoogle)
      await page.waitFor(getRandomInt(4000, 7000));
      // expect(page.url().indexOf("picpiclive.com")).toBeLessThan(0);
      await randomScroll(page, client, keyboard);
    }
  });
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function getRandomDevice() {
  const index = getRandomInt(0, devices.length);
  return devices[index];
}

/**
 *
 * @param {Page} page
 * @param {ElementHandle} element
 */
async function tapOnElement(page, element) {
  const x = await page.evaluate(
    elem => elem.offsetLeft - window.scrollX,
    element
  );
  const y = await page.evaluate(
    elem => elem.offsetTop - window.scrollY,
    element
  );
  console.log(`Tapping on ${x + 2},${y + 2}`);
  await page.touchscreen.tap(x + 4, y + 4);
}

async function raf(client) {
  await client.send("Runtime.evaluate", {
    expression:
      "new Promise(x => requestAnimationFrame(() => requestAnimationFrame(x)))",
    awaitPromise: true
  });
}

async function moveByDelta(page, client, keyboard, x, y, direction) {
  const initialScrollX = await page.evaluate(() => window.scrollX);
  const initialScrollY = await page.evaluate(() => window.scrollY);
  const targetScrollX = initialScrollX + x;
  const targetScrollY = initialScrollY + y;

  let scrollX = initialScrollX;
  let scrollY = initialScrollY;

  const touchOffsetX = 10;
  const touchOffsetY = 120;
  const touchPoints = [
    { x: initialScrollX + touchOffsetX, y: initialScrollY + touchOffsetY }
  ];

  await raf(client);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints,
    modifiers: keyboard._modifiers
  });

  // while (Math.abs(scrollY - targetScrollY) > 1.0) {
  for (let i = 0; i < 30; i++) {
    // Scroll.
    await raf(client);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x:
            initialScrollX +
            touchOffsetX +
            (direction * i * (targetScrollX - initialScrollX)) / 30,
          y:
            initialScrollY +
            touchOffsetY +
            (direction * i * (targetScrollY - initialScrollY)) / 30
        }
      ],
      modifiers: keyboard._modifiers
    });
  }

  await page.waitFor(getRandomInt(250, 450));
  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
    modifiers: keyboard._modifiers
  });
}

async function randomScroll(page, client, keyboard) {
  for (let i = 0; i < 10; i++) {
    await page.waitFor(getRandomInt(500, 2500));
    await moveByDelta(page, client, keyboard, 0, getRandomInt(100, 300), -1);
  }
}

function drawFromProbability(prob) {
  const draw = Math.random();
  if (draw < prob) {
    return true;
  }
  return false;
}
