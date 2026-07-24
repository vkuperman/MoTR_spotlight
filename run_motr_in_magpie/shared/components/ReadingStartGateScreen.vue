<template>
  <Screen title="" class="reading-start-gate-screen">
    <Slide>
      <div
        ref="target"
        class="reading-start-gate-target"
        :style="targetStyle"
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
      targetStyle: {
        top: '0px',
        left: '0px',
      },
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.syncTargetPlacement();
      window.addEventListener('resize', this.syncTargetPlacement);
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.syncTargetPlacement);
  },
  methods: {
    syncTargetPlacement() {
      const experiment = this.$el && this.$el.closest('.experiment');
      const header = experiment && experiment.querySelector('.header');
      const screen = this.$el && this.$el.closest('.screen');
      if (!experiment || !screen) return;

      const experimentRect = experiment.getBoundingClientRect();
      const screenRect = screen.getBoundingClientRect();
      const top = experimentRect.top - screenRect.top;
      const left = experimentRect.left - screenRect.left;

      this.targetStyle = {
        top: `${top}px`,
        left: `${left}px`,
      };
    },
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
  position: absolute;
  z-index: 20;
  box-sizing: border-box;
  width: 8ch;
  height: 8ch;
  border: 1px solid #333;
  background: transparent;
  cursor: default;
}
</style>
