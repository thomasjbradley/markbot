'use strict';

let
  diffWrap = document.querySelector('.tab-split'),
  splitter = document.querySelector('.splitter'),
  splitImgNew = document.getElementById('split-img-new'),
  splitImgRefCover = document.getElementById('split-img-ref-cover'),
  diffRange = document.getElementById('diff-range'),
  diff = document.getElementById('diff-img-diff')
  ;

const moveSplitter = function (x) {
  let newX = x - splitter.offsetWidth / 2;
  splitter.style.left = `${newX}px`;
};

const cropImage = function (x) {
  splitImgNew.style.webkitClipPath = `polygon(${x}px 0%, 100% 0%, 100% 100%, ${x}px 100%)`;
  splitImgRefCover.style.webkitClipPath = `polygon(${x}px 0%, 100% 0%, 100% 100%, ${x}px 100%)`;
};

const moveDiffer = function (x) {
  if (x >= 0 && x <= document.documentElement.clientWidth - splitter.offsetWidth) {
    moveSplitter(x);
    cropImage(x);
  }
};

const handleMouseMove = function (e) {
  moveDiffer(e.pageX)
};

const adjustDiff = function (opacity) {
  diff.style.opacity = opacity;
};

const calcTallestImage = function (imgRef, imgNew) {
  let
    scrollableWraps = document.querySelectorAll('.scrollable-wrap'),
    refAR = imgRef.offsetHeight / imgRef.offsetWidth,
    newAR = imgNew.offsetHeight / imgNew.offsetWidth
    ;

  if (imgRef.offsetHeight > imgNew.offsetHeight) {
    [].forEach.call(scrollableWraps, function (elem) {
      elem.style.paddingTop = (refAR * 100) + '%';
    });
  } else {
    [].forEach.call(scrollableWraps, function (elem) {
      elem.style.paddingTop = (newAR * 100) + '%';
    });
  }
};

const calcHeightOnLoad = function () {
  let
    imgRef = document.getElementById('split-img-ref'),
    imgNew = document.getElementById('split-img-new'),
    imgRefLoaded = false,
    imgNewLoaded = false,
    allLoaded = false
    ;

  imgRef.addEventListener('load', function () {
    imgRefLoaded = true;

    if (imgRefLoaded & imgNewLoaded & !allLoaded) {
      imgNewLoaded = true;
      calcTallestImage(imgRef, imgNew);
    }
  });

  imgNew.addEventListener('load', function () {
    imgNewLoaded = true;

    if (imgRefLoaded & imgNewLoaded & !allLoaded) {
      allLoaded = true;
      calcTallestImage(imgRef, imgNew);
    }
  });
};

const setImages = function (imgsJson) {
  let imgs = JSON.parse(imgsJson.replace(/\\/g, '/'));

  calcHeightOnLoad();

  document.getElementById('split-img-ref').src = `${imgs.ref}?${Date.now()}`;
  document.getElementById('split-img-new').src = `${imgs.new}?${Date.now()}`;
  document.getElementById('diff-img-ref').src = `${imgs.ref}?${Date.now()}`;
  document.getElementById('diff-img-new').src = `${imgs.new}?${Date.now()}`;
  document.getElementById('diff-img-diff').src = `${imgs.diff}?${Date.now()}`;

  diffRange.value = 0.5;
  moveDiffer(document.documentElement.clientWidth / 2);
};

diffWrap.addEventListener('mousedown', function (e) {
  moveDiffer(e.pageX);
  document.addEventListener('mousemove', handleMouseMove);
});

document.addEventListener('mouseup', function (e) {
  document.removeEventListener('mousemove', handleMouseMove);
});

diffRange.addEventListener('change', function (e) {
  adjustDiff(diffRange.value);
});

diffRange.addEventListener('input', function (e) {
  adjustDiff(diffRange.value);
});

adjustDiff(diffRange.value);
