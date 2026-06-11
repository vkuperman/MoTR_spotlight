import {
  appendOneStopTrialMeta,
  readOneStopTrialMetaFromEl,
} from './oneStopExportFields';
import {
  installRawPositionSampling,
  outOfBoundsWordForIndex,
  uninstallRawPositionSampling,
} from './motrRawSampling';

export default {
  data() {
    return {
      isCursorMoving: false,
      isClickHeld: false,
      showFirstDiv: true,
      mousePosition: { x: 0, y: 0 },
      clickStartTime: null,
      clickStartX: null,
      clickStartY: null,
      clickWordIndex: null,
      clickWord: null,
      clickWordRect: null,
      relativeXInWord: null,
      relativeYInWord: null,
      clickLineNumber: null,
      clickPositionInLine: null,
      interestAreasByIndex: {},
      lastItemId: null,
      currentIndex: null,
    };
  },
  watch: {
    '$magpie.currentScreenIndex'() {
      this.resetTrialView();
    },
  },
  mounted() {
    installRawPositionSampling(this);
  },
  beforeDestroy() {
    uninstallRawPositionSampling(this);
  },
  methods: {
    getCharSizePx() {
      const span = this.$el.querySelector('.readingText span[data-index]');
      if (span) {
        const rect = span.getBoundingClientRect();
        const width = span.innerHTML.length > 0 ? rect.width / span.innerHTML.length : 10;
        return { width, height: rect.height };
      }
      return { width: 10, height: 20 };
    },
    getLineClosestTo(clientY) {
      const spans = this.$el.querySelectorAll('.readingText span[data-index]');
      if (!spans.length) return null;
      let best = null;
      let bestDist = Infinity;
      for (let i = 0; i < spans.length; i++) {
        const rect = spans[i].getBoundingClientRect();
        const lineCenter = (rect.top + rect.bottom) / 2;
        const dist = Math.abs(lineCenter - clientY);
        if (dist < bestDist) {
          bestDist = dist;
          best = { lineTop: rect.top, lineBottom: rect.bottom, lineHeight: rect.height };
        }
      }
      return best;
    },
    computeInterestAreas() {
      const spans = this.$el.querySelectorAll('.readingText span[data-index]');
      if (!spans.length) {
        this.interestAreasByIndex = {};
        return;
      }

      const items = [];
      let maxHeight = 0;
      spans.forEach((span) => {
        const rect = span.getBoundingClientRect();
        const index = Number(span.getAttribute('data-index'));
        items.push({ index, rect });
        if (rect.height > maxHeight) maxHeight = rect.height;
      });

      const tol = 3;
      const byLine = {};
      for (const it of items) {
        const key = Math.round(it.rect.top / tol) * tol;
        if (!byLine[key]) byLine[key] = [];
        byLine[key].push(it);
      }

      const lines = Object.values(byLine)
        .map((line) => line.sort((a, b) => a.rect.left - b.rect.left))
        .sort((a, b) => a[0].rect.top - b[0].rect.top);

      const areas = {};
      const lineBounds = lines.map((lineItems) => {
        const tops = lineItems.map((li) => li.rect.top);
        const bottoms = lineItems.map((li) => li.rect.bottom);
        return {
          top: Math.min(...tops),
          bottom: Math.max(...bottoms),
        };
      });

      const lineVerticals = [];
      if (lineBounds.length === 1) {
        const lb = lineBounds[0];
        lineVerticals.push({ top: lb.top - 0.5 * maxHeight, bottom: lb.bottom + 0.5 * maxHeight });
      } else {
        const mids = [];
        for (let i = 0; i < lineBounds.length - 1; i++) {
          mids.push((lineBounds[i].bottom + lineBounds[i + 1].top) / 2);
        }
        for (let k = 0; k < lineBounds.length; k++) {
          let top;
          let bottom;
          if (k === 0) {
            const gap = lineBounds[1].top - lineBounds[0].bottom;
            top = lineBounds[0].top - gap / 2;
            bottom = mids[0];
          } else if (k === lineBounds.length - 1) {
            const gap = lineBounds[k].top - lineBounds[k - 1].bottom;
            top = mids[k - 1];
            bottom = lineBounds[k].bottom + gap / 2;
          } else {
            top = mids[k - 1];
            bottom = mids[k];
          }
          lineVerticals.push({ top, bottom });
        }
      }

      const { width: baseCharWidth } = this.getCharSizePx();
      const charWidth = baseCharWidth && Number.isFinite(baseCharWidth) ? baseCharWidth : 10;

      lines.forEach((lineItems, lineIdx) => {
        const n = lineItems.length;
        if (!n) return;

        const vBounds = lineVerticals[lineIdx];
        const isFirstLine = lineIdx === 0;
        const isLastLine = lineIdx === lines.length - 1;

        for (let i = 0; i < n; i++) {
          const curr = lineItems[i].rect;
          const idx = lineItems[i].index;
          let left;
          let right;

          if (n === 1) {
            left = curr.left;
            right = curr.right;
            if (isFirstLine) left -= charWidth / 2;
            if (isLastLine) right += charWidth / 2;
          } else if (i === 0) {
            const next = lineItems[i + 1].rect;
            left = curr.left;
            right = (curr.right + next.left) / 2;
            if (isFirstLine) left -= charWidth / 2;
          } else if (i === n - 1) {
            const prev = lineItems[i - 1].rect;
            left = (prev.right + curr.left) / 2;
            right = curr.right;
            if (isLastLine) right += charWidth / 2;
          } else {
            const prev = lineItems[i - 1].rect;
            const next = lineItems[i + 1].rect;
            left = (prev.right + curr.left) / 2;
            right = (curr.right + next.left) / 2;
          }

          areas[idx] = {
            left,
            right,
            top: vBounds.top,
            bottom: vBounds.bottom,
            lineNumber: lineIdx + 1,
          };
        }

        const firstIdx = lineItems[0].index;
        const lineStartX = areas[firstIdx].left;
        lineItems.forEach((it) => {
          areas[it.index].lineStartX = lineStartX;
        });
      });

      this.interestAreasByIndex = areas;
    },
    changeBack() {
      if (this.isClickHeld) {
        this.finishClick(performance.now());
      }
      const oval = this.$el.querySelector('.oval-cursor');
      if (oval) {
        oval.classList.remove('grow');
        oval.classList.remove('blank');
        oval.style.width = '0px';
        oval.style.height = '0px';
      }
      this.currentIndex = null;
      this.isClickHeld = false;
    },
    onRevealHover(e) {
      this.isCursorMoving = true;
      const x = e.clientX;
      const y = e.clientY;
      this.mousePosition.x = x;
      this.mousePosition.y = y;
      const now = performance.now();

      const oval = this.$el.querySelector('.oval-cursor');
      if (oval) oval.classList.add('grow');

      const { width: charWidth } = this.getCharSizePx();
      const line = this.getLineClosestTo(y);
      const charsLeft = 4;
      const charsRight = 14;
      const totalChars = charsLeft + charsRight;
      const ovalWidthPx = totalChars * charWidth;
      const ovalHeightPx = line ? line.lineHeight : 20;
      const ovalCenterY = line ? (line.lineTop + line.lineBottom) / 2 : y;
      oval.style.width = `${ovalWidthPx}px`;
      oval.style.height = `${ovalHeightPx}px`;
      oval.style.left = `${x + ((charsRight - charsLeft) / 2) * charWidth}px`;
      oval.style.top = `${ovalCenterY}px`;

      const itemInput = this.$el.querySelector('.item_id');
      if (itemInput) {
        const itemId = itemInput.value;
        if (this.lastItemId === null || this.lastItemId !== itemId) {
          this.interestAreasByIndex = {};
          this.lastItemId = itemId;
        }
      }

      if (!this.interestAreasByIndex || !Object.keys(this.interestAreasByIndex).length) {
        this.computeInterestAreas();
      }

      let ia = null;
      let iaIndex = null;
      for (const key of Object.keys(this.interestAreasByIndex)) {
        const a = this.interestAreasByIndex[key];
        if (x >= a.left && x <= a.right && y >= a.top && y <= a.bottom) {
          ia = a;
          iaIndex = Number(key);
          break;
        }
      }

      if (ia && iaIndex != null) {
        oval.classList.remove('blank');
        const index = iaIndex;
        const span = this.$el.querySelector(`.readingText span[data-index="${index}"]`);
        const wordText = span ? span.innerHTML : null;

        if (!this.isClickHeld || this.clickWordIndex !== index) {
          if (this.isClickHeld) this.finishClick(now);
          this.isClickHeld = true;
          this.clickStartTime = now;
          this.clickStartX = x;
          this.clickStartY = y;
        }

        this.clickWordIndex = index;
        this.clickWord = wordText;
        this.clickWordRect = { top: ia.top, left: ia.left, bottom: ia.bottom, right: ia.right };

        const width = ia.right - ia.left;
        const height = ia.bottom - ia.top;
        this.relativeXInWord = width > 0 ? (x - ia.left) / width : null;
        this.relativeYInWord = height > 0 ? (y - ia.top) / height : null;

        const { lineNumber, positionInLine } = this.getWordLineAndPositionInLine(index);
        this.clickLineNumber = lineNumber;
        this.clickPositionInLine = positionInLine;
        this.currentIndex = index;
      } else {
        if (this.isClickHeld) this.finishClick(now);
        this.isClickHeld = false;
        oval.classList.add('blank');
        this.clickWordIndex = -1;
        this.clickWord = null;
        this.clickWordRect = null;
        this.relativeXInWord = null;
        this.relativeYInWord = null;
        this.clickLineNumber = null;
        this.clickPositionInLine = null;
        this.currentIndex = -1;
      }
    },
    getWordLineAndPositionInLine(wordIndex) {
      const spans = this.$el.querySelectorAll('.readingText span[data-index]');
      if (!spans.length) return { lineNumber: null, positionInLine: null };
      const items = [];
      for (let i = 0; i < spans.length; i++) {
        const rect = spans[i].getBoundingClientRect();
        const idx = spans[i].getAttribute('data-index');
        items.push({ index: idx, top: rect.top, left: rect.left });
      }
      const tol = 3;
      const byLine = {};
      for (const it of items) {
        const key = Math.round(it.top / tol) * tol;
        if (!byLine[key]) byLine[key] = [];
        byLine[key].push(it);
      }
      const lines = Object.keys(byLine).map((k) => byLine[k]).sort((a, b) => a[0].top - b[0].top);
      for (let l = 0; l < lines.length; l++) {
        lines[l].sort((a, b) => a.left - b.left);
        for (let p = 0; p < lines[l].length; p++) {
          if (String(lines[l][p].index) === String(wordIndex)) {
            return { lineNumber: l + 1, positionInLine: p + 1 };
          }
        }
      }
      return { lineNumber: null, positionInLine: null };
    },
    finishClick(endTime) {
      const expEl = this.$el.querySelector('.experiment_id');
      if (!expEl) return;
      const durationMs = this.clickStartTime != null ? endTime - this.clickStartTime : null;
      const subjectId =
        this.$magpie && this.$magpie.measurements && this.$magpie.measurements.SubjectID
          ? this.$magpie.measurements.SubjectID
          : '';
      const trialIndexEl = this.$el.querySelector('.trial_index');
      const presentationOrder = trialIndexEl && trialIndexEl.value !== '' ? parseInt(trialIndexEl.value, 10) : null;
      const spans = this.$el.querySelectorAll('.readingText span[data-index]');
      const totalWordsInItem = spans && spans.length ? spans.length : null;
      const allWords = spans && spans.length ? Array.from(spans).map((s) => s.innerHTML).join(' ') : null;
      const payload = {
        recordType: 'hover_association',
        Experiment: expEl.value,
        Condition: this.$el.querySelector('.condition_id').value,
        ItemId: this.$el.querySelector('.item_id').value,
        presentation_order: presentationOrder,
        Index: this.clickWordIndex !== null && this.clickWordIndex !== -1
          ? parseInt(this.clickWordIndex, 10)
          : this.clickWordIndex,
        Word: outOfBoundsWordForIndex(this.clickWordIndex, this.clickWord),
        mousePositionX: this.clickStartX,
        mousePositionY: this.clickStartY,
        revealMode: 'hover',
        clickDurationMs: durationMs,
        hoverDurationMs: durationMs,
        relativeXInWord: this.relativeXInWord,
        relativeYInWord: this.relativeYInWord,
        totalWordsInItem,
        allWords,
        SubjectId: subjectId,
        SubjectID: subjectId,
        SonaId: subjectId,
      };
      if (this.clickWordRect) {
        payload.wordPositionTop = this.clickWordRect.top;
        payload.wordPositionLeft = this.clickWordRect.left;
        payload.wordPositionBottom = this.clickWordRect.bottom;
        payload.wordPositionRight = this.clickWordRect.right;
      }
      if (this.clickLineNumber != null) payload.line_number = this.clickLineNumber;
      if (this.clickPositionInLine != null) payload.position_in_line = this.clickPositionInLine;
      appendOneStopTrialMeta(payload, readOneStopTrialMetaFromEl(this.$el));
      $magpie.addTrialData(payload);
      this.clickStartTime = null;
      this.clickStartX = null;
      this.clickStartY = null;
      this.clickWordIndex = null;
      this.clickWord = null;
      this.clickWordRect = null;
      this.relativeXInWord = null;
      this.relativeYInWord = null;
      this.clickLineNumber = null;
      this.clickPositionInLine = null;
    },
    toggleDivs() {
      this.showFirstDiv = !this.showFirstDiv;
      this.isCursorMoving = false;
    },
    resetTrialView() {
      this.showFirstDiv = true;
      this.isCursorMoving = false;
      this.isClickHeld = false;
      this.currentIndex = null;
      this.interestAreasByIndex = {};
      this.lastItemId = null;
      this.changeBack();
    },
    recordResponse(trial) {
      const m = this.$magpie && this.$magpie.measurements ? this.$magpie.measurements : null;
      if (!m || !m.response) return;
      const itemId = trial.item_id != null ? trial.item_id : trial.ItemId;
      const selectedResponse = String(m.response).trim();
      const correctAnswer = trial && trial.response_true != null
        ? String(trial.response_true).replace(/ ?["]+/g, '').trim()
        : '';
      const responseCorrect = correctAnswer !== '' ? (selectedResponse === correctAnswer ? '1' : '0') : '';
      this.$magpie.addTrialData({
        ItemId: itemId,
        response: selectedResponse,
        response_correct: responseCorrect,
      });
    },
    submitTrialResponse(trial, trialIndex) {
      try {
        this.recordResponse(trial);
      } catch (err) {
        console.warn('recordResponse failed:', err);
      } finally {
        this.$magpie.saveAndNextScreen();
        if (typeof this.onReadingTrialComplete === 'function') {
          this.onReadingTrialComplete(trial, trialIndex);
        }
      }
    },
  },
};
