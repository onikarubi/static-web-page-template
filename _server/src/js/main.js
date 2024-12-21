const targetElm = document.getElementById('output');

const outputText = (input) => {
  targetElm.textContent = input;
}

window.addEventListener('load', () => {
  outputText('Hello World!');
});
