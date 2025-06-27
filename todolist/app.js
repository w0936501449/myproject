function addItem() {
  const ul = document.getElementById('list');
  const input = document.getElementById('input');
  const text = input.value;
  if (text === '') {
    alert('請輸入內容');
    return;
  }

  const newItem = document.createElement('li');
  newItem.classList.add('item');
  newItem.innerText = text;

  newItem.onclick = checkItem;

  const deleteButton = document.createElement('span');
  deleteButton.classList.add('delete');

  deleteButton.onclick = deleteItem;

  newItem.appendChild(deleteButton);

  input.value = ''; 
  ul.appendChild(newItem);
}

function checkItem() {
  const item = this;
  item.classList.toggle('checked');
}

function deleteItem() {
  const item = this.parentNode;
  const parent = item.parentNode;
  parent.removeChild(item);
}
const addButton = document.getElementById('add-button');
addButton.addEventListener('click', addItem);

// 防止FORM刷新頁面
const form = document.getElementById('input-wrapper');
form.addEventListener('submit', (e) => {
  e.preventDefault();
});
