<template>
  <div style="width: 70%; margin: auto">
    <h1 style="text-align: center; margin: 20px; color: green">
      User Agent Check
    </h1>

    <div style="margin-bottom: 10px; text-align: center">
      <input type="text" v-model="user_id" style="padding: 10px" />
      <button
        @click="handleFetch"
        style="
          padding: 12px;
          background-color: green;
          color: white;
          border: none;
        "
      >
        Check
      </button>
    </div>

    <div style="border: 1px solid pink; padding: 20px; font-size: 1.25rem">
      MD5: <strong>{{ md5Value }}</strong>
    </div>

    <div style="border: 1px solid pink; padding: 20px; margin-top: 20px">
      <p style="font-size: 1.25rem">
        <code>
          <pre style="white-space: break-spaces">{{ headersValue }}</pre>
        </code>
      </p>
    </div>

    <p>Params: {{ params }}</p>
  </div>
</template>

<script setup>
const headersValue = ref("");
const md5Value = ref("");
const params = ref("");
const user_id = ref("");

const handleFetch = async () => {
  fetch(`/api/hello?user_id=${user_id.value}`, {
    method: "GET",
    params: { user_id: user_id.value },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data); // Logs the response which includes headers

      headersValue.value = data?.headers;

      md5Value.value = data?.digest;
      params.value = data?.params;
    });
};
</script>
