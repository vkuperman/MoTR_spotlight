<template>
  <Screen title="" class="reading-start-gate-screen">
    <Slide>
      <div
        ref="target"
        class="reading-start-gate-target"
        aria-hidden="true"
        @mouseenter="advance"
      />
    </Slide>
  </Screen>
</template>

<script>
import { Screen, Slide } from 'magpie-base';

export default {
  name: 'ReadingStartGateScreen',
  components: { Screen, Slide },
  props: {
    trialIndex: { type: Number, default: null },
  },
  data() {
    return {
      hasAdvanced: false,
    };
  },
  methods: {
    advance() {
      if (this.hasAdvanced) return;
      this.hasAdvanced = true;
      this.$magpie.saveAndNextScreen();
    },
  },
};
</script>

<style scoped>
.reading-start-gate-screen >>> .screen-title,
.reading-start-gate-screen >>> h2 {
  display: none;
}

.reading-start-gate-target {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 20;
  box-sizing: border-box;
  width: 3ch;
  height: 3ch;
  border: 1px solid #333;
  background: transparent;
  cursor: default;
}
</style>
