self.onmessage = (event) => {
  const {canvas, scale, playButton} = event.data;
  playButton.addEventListener('click', toggle);

  const mainCanvasCtx = canvas.getContext('2d');   
  mainCanvasCtx.scale(scale, scale);
  

  const requestMaxX = 50 + distance;
  const executionMaxX = 50 + distance * 2;
  const minY = 80;
  const maxY = 180;
  const responseMaxX = 50 + distance * 3;
  const bulletRadius = 10;

  let requestList = [];
  let requestFinishList = [];
  let executionList = [];
  let executionFinishList = [];
  let responseList = [];
  let responseFinishList = [];
  let createRequestInterval;

  const init = () => {
    requestList = [];
    requestFinishList = [];
    executionList = [];
    executionFinishList = [];
    responseList = [];
    responseFinishList = [];

    mainCanvasCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  }

  const generateRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const didFinishRequestTask = (item) => {
    return item.x > requestMaxX - bulletRadius;
  }

  const didFinishExecutionTask = (item) => {
    return new Date().getTime() - item.startTimestamp >= item.executionTime;
  }

  const didFinishResponseTask = (item) => {
    return item.x > responseMaxX - bulletRadius;
  }

  const drawBullet = (item, colorLabel, drawTail = true) => {
    if(drawTail) {
      const gradient = mainCanvasCtx.createLinearGradient(item.x - bulletRadius * 4, item.y, item.x, item.y);
      gradient.addColorStop(0, `rgba(${colors[colorLabel]}, 0)`);
      gradient.addColorStop(1, `rgba(${colors[colorLabel]}, 0.8)`);

      mainCanvasCtx.beginPath();
      mainCanvasCtx.moveTo(item.x - bulletRadius * 5, item.y);
      mainCanvasCtx.lineTo(item.x, item.y + bulletRadius - 1);
      mainCanvasCtx.lineTo(item.x, item.y + -bulletRadius + 1);
      mainCanvasCtx.closePath();
      mainCanvasCtx.fillStyle = gradient;
      mainCanvasCtx.fill();
      

      mainCanvasCtx.beginPath();
      mainCanvasCtx.arc(item.x, item.y, bulletRadius, 0, Math.PI * 2);
      mainCanvasCtx.fillStyle = '#4C4C4C'
      mainCanvasCtx.fill();
      
    }

    const gradient = mainCanvasCtx.createRadialGradient(item.x, item.y, 1, item.x, item.y, 10);
    gradient.addColorStop(0, `rgba(${colors[colorLabel]}, 0.1)`);
    gradient.addColorStop(1, `rgba(${colors[colorLabel]}, 1)`);

    mainCanvasCtx.beginPath();
    mainCanvasCtx.arc(item.x, item.y, bulletRadius, 0, Math.PI * 2);
    mainCanvasCtx.fillStyle = gradient;
    mainCanvasCtx.fill();
    
  }

  const createReqeust = () => {
    const newReqeustList = [];

    for(let i = 0; i < 20; i++) {
      const executionTime = generateRandomNumber(0, 10) * 1000;
      newReqeustList.push({
        x: 50,
        y: 130,
        dx: generateRandomNumber(5, distance - 1),
        dy: 0,
        startTimestamp: 0,
        executionTime: executionTime,
        executionStatus: executionTime <= 3000? 'normal' : executionTime <= 5000? 'warning' : 'error'
      });
    }

    requestList = requestList.concat(newReqeustList);
  }


  const draw = () => {
    mainCanvasCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    const willAddExecutionList = requestList.filter((item, index) => requestFinishList.indexOf(index) >= 0);
    requestList = requestList.filter((item, index) => requestFinishList.indexOf(index) < 0);
    requestFinishList = [];

    const willAddResponseList = executionList.filter((item, index) => executionFinishList.indexOf(index) >= 0);
    executionList = executionList.filter((item, index) => executionFinishList.indexOf(index) < 0);
    executionFinishList = [];

    responseList = responseList.filter((item, index) => responseFinishList.indexOf(index) < 0);
    responseFinishList = [];

    const currentTimestamp = new Date().getTime();
    requestList = requestList.map((item, index) => {
      if(item.startTimestamp == 0) {
        item.startTimestamp = currentTimestamp;
      } else {
        item.x += item.dx;
      }

      if(didFinishRequestTask(item)) {
        requestFinishList.push(index);
      } else {
        drawBullet(item, 'normal');
      }

      return item;
    });

    executionList = executionList.concat(willAddExecutionList.map((item) => {
      return {
        ...item,
        startTimestamp: 0,
        x: generateRandomNumber(bulletRadius + requestMaxX, executionMaxX - bulletRadius),
        y: generateRandomNumber(bulletRadius + minY, maxY - bulletRadius),
        dx: generateRandomNumber(1, 5),
        dy: generateRandomNumber(1, 5)
      }
    }));
    executionList = executionList.map((item, index) => {
      if(!item.startTimestamp) {
        item.startTimestamp = currentTimestamp;
      } else {
        if(item.x + item.dx + bulletRadius > executionMaxX || item.x + item.dx - bulletRadius < requestMaxX) {
          item.dx = -item.dx;
        }

        if(item.y + item.dy + bulletRadius > maxY || item.y + item.dy - bulletRadius < minY) {
          item.dy = -item.dy;
        }

        item.x += item.dx;
        item.y += item.dy;
      }

      if(didFinishExecutionTask(item)) {
        executionFinishList.push(index);
      } else {
        drawBullet(item, item.executionStatus, false);
      }

      return item;
    });

    if(willAddResponseList.length > 0) {
      const reducedItem = willAddResponseList.reduce((previousItem, currentItem) => {
        return previousItem.executionTime < currentItem.executionTime? currentItem : previousItem;
      }, {executionTime: -1});

      responseList = responseList.concat([{
          ...reducedItem,
          startTimestamp: 0,
          x: executionMaxX,
          y: 130,
          dx: generateRandomNumber(5, distance),
          dy: 0
        }]);
    }
    responseList = responseList.map((item, index) => {
      if(item.startTimestamp == 0) {
        item.startTimestamp = currentTimestamp;
      } else {
        item.x += item.dx;
      }

      if(didFinishResponseTask(item)) {
        responseFinishList.push(index);
      } else {
        drawBullet(item, item.executionStatus);
      }

      return item;
    });

    if(continueAnimate) {
      requestAnimationFrame(draw);
    }
  }

  const toggle = () => {
    continueAnimate = !continueAnimate;

    if(continueAnimate) {
      init();

      createReqeust();
      requestAnimationFrame(draw);

      createRequestInterval = setInterval(() => {
        createReqeust();
      }, 1000);
    } else {
      if(createRequestInterval != undefined) {
        clearInterval(createRequestInterval);
      }
    }

  }
}