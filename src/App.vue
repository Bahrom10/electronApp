<script setup>
import { computed, ref } from 'vue';
import Button from './components/Button.vue';

const folderPath = ref("C:/Users/")
const activeFolderPath = ref("")
const showCode = ref(true)
const iframeRef = ref()
const folderContent = ref([])
const textareaRef = ref()
const activeFilePath = ref("")

const showContent = async () => {
  activeFolderPath.value = folderPath.value
  folderContent.value = await window.ipcRenderer.invoke("getFolderContent", activeFolderPath.value)
}

const handleActiveFile = async (pathname) => {
  const fullPath = activeFolderPath.value + "/" + pathname;
  const fileContent = await window.ipcRenderer.invoke("getFileContent", fullPath)
  activeFilePath.value = fullPath
  textareaRef.value.value = fileContent
  iframeRef.value.src = fullPath
}
const handleActiveFolder = async (pathname) => {
  const fullPath = activeFolderPath.value + "/" + pathname
  folderPath.value = fullPath
  activeFolderPath.value = fullPath
  folderContent.value = await window.ipcRenderer.invoke("getFolderContent", fullPath)
}
const handleLevelUp = async () => {
  activeFolderPath.value = activeFolderPath.value.replace("\\","/")
  let newPath = activeFolderPath.value.split("/").slice(0, -1).join("/")

  
  folderPath.value = newPath
  activeFolderPath.value = newPath
  folderContent.value = await window.ipcRenderer.invoke("getFolderContent", newPath)
}
const changeFileContent = async () => {
  await window.ipcRenderer.invoke("writeFileContent", activeFilePath.value, textareaRef.value.value)
}
</script>

<template>
  <input type="text" v-model="folderPath">
  <button @click="showContent" @keydown.enter>Показать содержимое</button>
  <div class="wrapper">
    <button class="wrapper-content" @click="handleLevelUp">На уровень выше. ↑</button>
    <Button class="wrapper-content" @activeFile="handleActiveFile" @activeFolder="handleActiveFolder" v-for="item in folderContent" :key="item.path" :item="item">
      {{ item.path }}
      {{ item.isFile ? "File" : "Folder" }}
    </Button>
  </div>
  <div class="prewrap">
    <div class="prewrap-choise">
      <input type="radio" name="showCode" id="code" :value="true" v-model="showCode">
      <label for="code">Показать код</label>
      <input type="radio" name="showCode" id="iframe" :value="false" v-model="showCode">
      <label for="iframe">Показать фрейм</label>
    </div>
    <pre v-show="showCode"><textarea name="" id="" ref="textareaRef" rows="10" cols="100"></textarea>
    </pre>
    <iframe v-show="!showCode" src="" frameborder="0" ref="iframeRef"></iframe>
    <button class="prewrap-submit" v-show="showCode" @click="changeFileContent">Сохранить</button>
  </div>
</template>

<style scoped>
input[type="text"] {
  width: 500px;
  padding: 10px;
  font-size: 1rem;
}
button:not(.wrapper-content){
  padding: 10px;
  font-size: 1rem;
}

.wrapper {
  display: flex;
  flex-direction: column;
}

.wrapper-content {
  color: white;
  font-size: 1.5rem;
  background-color: #4CAF50;
  display: flex;
  justify-content: space-between;
}
.wrapper-content:focus{
  background-color: #3e8e41;
}
</style>