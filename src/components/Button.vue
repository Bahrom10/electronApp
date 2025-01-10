<template>
    <button class="wrapper-content" @click="handleClick">
        <span>{{ item.path }}</span>
    <span>{{ item.isFile ? "File" : "Folder"}}</span>
    </button>
</template>

<script setup>
const emit = defineEmits(["activeFile","activeFolder"])

const { item, parentPath } = defineProps({
    item: {
        type: {
            path: String,
            isFile: Boolean
        },
        required: true
    }
})
const handleClick = () => {
    if (item.isFile) {
        emit("activeFile", item.path)
    } else {
        emit("activeFolder", item.path)
    }
}
</script>

<style scoped>

</style>