setTimeout(() => {
  console.log('1. setTimeout');
}, 0);

setImmediate(() => {
  console.log('2. setImmediate');
});

process.nextTick(() => {
  console.log('3. process.nextTick');
});

Promise.resolve().then(() => {
  console.log('4. Promise.then');
});

console.log('5. Синхронный код');

/*
 * Сначала выполняется синхронный код текущего скрипта.
 * Поэтому строка 5 появляется первой.
 *
 * После завершения текущего стека Node.js сначала очищает очередь
 * process.nextTick, затем очередь микрозадач Promise. Поэтому далее
 * идут строки 3 и 4.
 *
 * Затем Node.js переходит к фазам цикла событий. setTimeout относится
 * к фазе timers, а setImmediate - к фазе check. При запуске из обычного
 * файла Node.js обычно выводит timers раньше check:
 *
 * 5. Синхронный код
 * 3. process.nextTick
 * 4. Promise.then
 * 1. setTimeout
 * 2. setImmediate
 *
 * Порядок последних двух строк может зависеть от среды запуска, потому
 * что setTimeout(0) и setImmediate() на верхнем уровне имеют особый
 * случай планирования.
 */
