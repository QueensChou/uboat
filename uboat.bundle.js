/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./resources/overlay_plugin_api.ts
// OverlayPlugin API setup
let inited = false;
let wsUrl = null;
let ws = null;
let queue = [];
let rseqCounter = 0;
const responsePromises = {};
const subscribers = {};

const sendMessage = (msg, cb) => {
  if (ws) {
    if (queue) queue.push(msg);else ws.send(JSON.stringify(msg));
  } else {
    if (queue) queue.push([msg, cb]);else window.OverlayPluginApi.callHandler(JSON.stringify(msg), cb);
  }
};

const processEvent = msg => {
  init();
  const subs = subscribers[msg.type];
  subs?.forEach(sub => {
    try {
      sub(msg);
    } catch (e) {
      console.error(e);
    }
  });
};

const dispatchOverlayEvent = processEvent;
const addOverlayListener = (event, cb) => {
  init();

  if (!subscribers[event]) {
    subscribers[event] = [];

    if (!queue) {
      sendMessage({
        call: 'subscribe',
        events: [event]
      });
    }
  }

  subscribers[event]?.push(cb);
};
const removeOverlayListener = (event, cb) => {
  init();

  if (subscribers[event]) {
    const list = subscribers[event];
    const pos = list?.indexOf(cb);
    if (pos !== undefined && pos > -1) list?.splice(pos, 1);
  }
};

const callOverlayHandlerInternal = (_msg // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => {
  init();
  const msg = { ..._msg,
    rseq: 0
  };
  let p;

  if (ws) {
    msg.rseq = rseqCounter++;
    p = new Promise((resolve, reject) => {
      responsePromises[msg.rseq] = {
        resolve: resolve,
        reject: reject
      };
    });
    sendMessage(msg);
  } else {
    p = new Promise((resolve, reject) => {
      sendMessage(msg, data => {
        if (data === null) {
          resolve(data);
          return;
        }

        const parsed = JSON.parse(data);
        if (parsed['$error']) reject(parsed);else resolve(parsed);
      });
    });
  }

  return p;
};

const callOverlayHandlerOverrideMap = {};
const callOverlayHandler = (_msg // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => {
  init(); // If this `as` is incorrect, then it will not find an override.
  // TODO: we could also replace this with a type guard.

  const type = _msg.call;
  const callFunc = callOverlayHandlerOverrideMap[type] ?? callOverlayHandlerInternal; // The `IOverlayHandler` type guarantees that parameters/return type match
  // one of the overlay handlers.  The OverrideMap also only stores functions
  // that match by the discriminating `call` field, and so any overrides
  // should be correct here.
  // eslint-disable-next-line max-len
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-argument

  return callFunc(_msg);
};
const setOverlayHandlerOverride = (type, override) => {
  if (!override) {
    delete callOverlayHandlerOverrideMap[type];
    return;
  }

  callOverlayHandlerOverrideMap[type] = override;
};
const init = () => {
  if (inited) return;

  if (typeof window !== 'undefined') {
    wsUrl = new URLSearchParams(window.location.search).get('OVERLAY_WS');

    if (wsUrl !== null) {
      const connectWs = function (wsUrl) {
        ws = new WebSocket(wsUrl);
        ws.addEventListener('error', e => {
          console.error(e);
        });
        ws.addEventListener('open', () => {
          console.log('Connected!');
          const q = queue ?? [];
          queue = null;
          sendMessage({
            call: 'subscribe',
            events: Object.keys(subscribers)
          });

          for (const msg of q) {
            if (!Array.isArray(msg)) sendMessage(msg);
          }
        });
        ws.addEventListener('message', _msg => {
          try {
            if (typeof _msg.data !== 'string') {
              console.error('Invalid message data received: ', _msg);
              return;
            }

            const msg = JSON.parse(_msg.data);
            const promiseFuncs = msg?.rseq !== undefined ? responsePromises[msg.rseq] : undefined;

            if (msg.rseq !== undefined && promiseFuncs) {
              if (msg['$error']) promiseFuncs.reject(msg);else promiseFuncs.resolve(msg);
              delete responsePromises[msg.rseq];
            } else {
              processEvent(msg);
            }
          } catch (e) {
            console.error('Invalid message received: ', _msg);
            return;
          }
        });
        ws.addEventListener('close', () => {
          queue = null;
          console.log('Trying to reconnect...'); // Don't spam the server with retries.

          window.setTimeout(() => {
            connectWs(wsUrl);
          }, 300);
        });
      };

      connectWs(wsUrl);
    } else {
      const waitForApi = function () {
        if (!window.OverlayPluginApi?.ready) {
          window.setTimeout(waitForApi, 300);
          return;
        }

        const q = queue ?? [];
        queue = null;
        window.__OverlayCallback = processEvent;
        sendMessage({
          call: 'subscribe',
          events: Object.keys(subscribers)
        });

        for (const item of q) {
          if (Array.isArray(item)) sendMessage(item[0], item[1]);
        }
      };

      waitForApi();
    } // Here the OverlayPlugin API is registered to the window object,
    // but this is mainly for backwards compatibility.For cactbot's built-in files,
    // it is recommended to use the various functions exported in resources/overlay_plugin_api.ts.


    window.addOverlayListener = addOverlayListener;
    window.removeOverlayListener = removeOverlayListener;
    window.callOverlayHandler = callOverlayHandler;
    window.dispatchOverlayEvent = dispatchOverlayEvent;
  }

  inited = true;
};
;// CONCATENATED MODULE: ./ui/test/test.ts

// 物品价格
const goodsPrice = {
  SalvagedRing: 8000,
  SalvagedBracelet: 9000,
  SalvagedEarring: 10000,
  SalvagedNecklace: 13000,
  ExtravagantSalvagedRing: 27000,
  ExtravagantSalvagedBracelet: 28500,
  ExtravagantSalvagedEarring: 30000,
  ExtravagantSalvagedNecklace: 34500,
}
// 物品名称
const goodsName = {
  SalvagedRing: "沉船戒指",
  SalvagedBracelet: "沉船手镯",
  SalvagedEarring: "沉船耳饰",
  SalvagedNecklace: "沉船项链",
  ExtravagantSalvagedRing: "上等沉船戒指",
  ExtravagantSalvagedBracelet: "上等沉船手镯",
  ExtravagantSalvagedEarring: "上等沉船耳饰",
  ExtravagantSalvagedNecklace: "上等沉船项链",
}

// localStorage.clear();
// 测试数据
const testData = {
  "2023-03-14": [
    {
      name: "SalvagedRing",
      number: 2,
    },
    {
      name: "SalvagedBracelet",
      number: 2,
    },
    {
      name: "ExtravagantSalvagedBracelet",
      number: 2,
    },
    {
      name: "ExtravagantSalvagedNecklace",
      number: 2,
    },
  ],
  "2023-03-12": [
    {
      name: "SalvagedRing",
      number: 4,
    },
    {
      name: "SalvagedBracelet",
      number: 4,
    },
    {
      name: "ExtravagantSalvagedBracelet",
      number: 4,
    },
    {
      name: "ExtravagantSalvagedNecklace",
      number: 4,
    },
  ],
  "2023-03-18": [
    {
      name: "SalvagedRing",
      number: 6,
    },
    {
      name: "SalvagedBracelet",
      number: 2,
    },
    {
      name: "ExtravagantSalvagedBracelet",
      number: 4,
    },
    {
      name: "ExtravagantSalvagedNecklace",
      number: 6,
    },
  ]
}
// localStorage.setItem("history", JSON.stringify(testData));

// 记录数据日期
let historyTime = localStorage.getItem("time");
// 当天数据
let todayData = localStorage.getItem("today");
// 历史数据
let historyData = localStorage.getItem("history");
// 今天的日期
const todayTime = dayjs().format("YYYY-MM-DD");

// $(".log").html(historyTime + "/" + JSON.stringify(todayData))

// 数据不存在则存储当前日期
if (!historyTime) {
  historyTime = todayTime;
}

if (!todayData) {
  todayData = [];
} else {
  todayData = JSON.parse(todayData);
}
if (!historyData) {
  historyData = {};
} else {
  historyData = JSON.parse(historyData);
}
// 如果记录日期为之前的，则存储到历史数据
if (dayjs(historyTime, "YYYY-MM-DD").isBefore(dayjs(todayTime, "YYYY-MM-DD"), 'day')) {
  // 存储数据
  if (todayData.length) {
    historyData[historyTime] = todayData;
  }
  todayData = [];
  historyTime = todayTime;
  // 存储到本地
  localStorage.setItem("time", historyTime);
  localStorage.setItem("history", JSON.stringify(historyData));
  localStorage.removeItem("today");
}

// 显示当前日期
$(".date_select_word").html(historyTime);

// todayData = [{
//   name: "SalvagedRing",
//   number: 5,
// },
// {
//   name: "SalvagedBracelet",
//   number: 5,
// },
// {
//   name: "ExtravagantSalvagedBracelet",
//   number: 5,
// },
// {
//   name: "ExtravagantSalvagedNecklace",
//   number: 5,
// }]

// 显示列表
async function showList(data) {
  let str = ""
  let total = 0
  if (data && data.length) {
    for (let item of data) {
      str += `<li class="list">
        <p class="list_name">${goodsName[item.name]}</p>
        <p class="list_number">x${item.number}</p>
        <p class="list_total">${item.number * goodsPrice[item.name]}</p>
      </li>`
      total += item.number * goodsPrice[item.name]
    }
  } else {
    str = `<li class="list"><p class="list_number">暂无数据</p></li>`
  }
  $(".index_middle").html(str)
  $(".index_bottom_number").html(total)
}
// 展示今日数据
showList(todayData)

// let index = 0;
// 前一天
$(".date_select_left").click(function() {
  let time = $(".date_select_word").html();
  time = dayjs(time, "YYYY-MM-DD").subtract(1, 'day').format("YYYY-MM-DD");
  let data = historyData[time];
  if (time === historyTime) {
    data = todayData
  }
  $(".date_select_word").html(time);
  showList(data);
})
// 后一天
$(".date_select_right").click(function() {
  let time = $(".date_select_word").html();
  time = dayjs(time, "YYYY-MM-DD").add(1, 'day').format("YYYY-MM-DD");
  let data = historyData[time];
  if (time === historyTime) {
    data = todayData
  }
  $(".date_select_word").html(time);
  showList(data);
})
// 清空记录
$(".clear_log").click(function() {
  localStorage.removeItem("history");
  historyData = [];
  $(".date_select_word").html(historyTime);
  showList(null);
})

// 获取日志
addOverlayListener('onLogEvent', e => {
  // $(".log").html(JSON.stringify(e.detail.logs))
  // 循环日志
  for (let log of e.detail.logs) {
    // void callOverlayHandler({
    //   call: 'cactbotSay',
    //   text: "11"
    // });
    // 正则处理
    const r = /00:083E:.*获得了“.{1}(沉船戒指|沉船手镯|沉船耳饰|沉船项链|上等沉船戒指|上等沉船手镯|上等沉船耳饰|上等沉船项链)”×?(\d*)/.exec(log);
    const name = r[1];
    let number = r[2];
    let formatName = ""
    // 如果存在该物品
    if (name) {
      // 转换数量
      if (number) {
        number = Number(number);
      } else {
        number = 1;
      }
      // 格式化名称
      for (let key in goodsName) {
        // void callOverlayHandler({
        //   call: 'cactbotSay',
        //   text: key
        // });
        if (goodsName[key] === name) {
          formatName = key
        }
      }
      // 今日数据是否已有该物品
      let hasThis = false;
      if (todayData.length) {
        for (let data of todayData) {
          // 存在则增加数量
          if (data.name === formatName) {
            hasThis = true;
            data.number += number;
            break;
          }
        }
      }
      // 不存在则添加
      if (!hasThis) {
        todayData.push({
          name: formatName,
          number: number
        })
      }
      // 存储数据
      localStorage.setItem("today", JSON.stringify(todayData));
      // 展示列表
      showList(todayData);
    }
    
    // if (name) {
    //   void callOverlayHandler({
    //     call: 'cactbotSay',
    //     text: name + number + "个"
    //   });
    // }
  }
});
addOverlayListener('onUserFileChanged', e => {
  console.log(`User file ${e.file} changed!`);
});
addOverlayListener('FileChanged', e => {
  console.log(`File ${e.file} changed!`);
});
void callOverlayHandler({
  call: 'cactbotRequestState'
});
/******/ })()
;