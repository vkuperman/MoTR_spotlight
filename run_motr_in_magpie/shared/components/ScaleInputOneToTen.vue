<template>
  <div class="demo-scale-row" role="group">
    <button
      v-for="n in 10"
      :key="n"
      type="button"
      class="demo-scale-box"
      :class="{ 'demo-scale-box--selected': Number(value) === n }"
      :aria-pressed="Number(value) === n ? 'true' : 'false'"
      @click="$emit('input', String(n))"
    >
      {{ n }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'ScaleInputOneToTen',
  props: {
    value: { type: [String, Number], default: '' },
  },
};
</script>

<style>
.demo-scale-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  margin: 0.5em 0 1.5em;
  max-width: 100%;
}

.demo-scale-box {
  flex: 1 1 0;
  min-width: 2rem;
  padding: 0.55em 0;
  border: 1px solid #888;
  border-radius: 3px;
  background: #fff;
  color: #222;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  text-align: center;
}

.demo-scale-box:hover {
  border-color: #444;
  background: #f5f5f5;
}

.demo-scale-box--selected {
  background: #333;
  border-color: #333;
  color: #fff;
}

.demo-scale-box--selected:hover {
  background: #222;
}
</style>
