<template>
  <div>
    <div style="width: 40em; margin: auto;">
      <div style="background-color: lightgrey; padding: 10px;">
        <b>Letter of Information and Consent</b><br>
        Mouse- and eye-tracking (Prolific)
      </div>
      <p>
        <b>Principal Investigator:</b><br>
        Dr. Victor Kuperman, Dept. of Linguistics and Languages<br>
        McMaster University; Email: vickup@mcmaster.ca, 905-525-9140 x20384
        <br><br>
        <b>Co-Investigator:</b><br>
        Dr. Emalie Hendel, Dept. of Linguistics and Languages<br>
        McMaster University, Email: hendele@mcmaster.ca
        <br><br>
        <b>Purpose of the Study:</b> The purpose of this study is to explore whether a new mouse-tracking paradigm can accurately measure text reading behaviours. You are invited to participate in this study, which investigates a new mouse-tracking paradigm during text reading.
        <br><br>
        <b>What is mouse-tracking?</b><br>
        Mouse-tracking uses an online platform to register the position on the screen where you click the mouse, and the duration for which you hold that position. In a mouse-tracking paradigm, all text is blurred until you click on a word. Upon clicking, a small, clear window appears, allowing you to read that portion of the text.
        <br><br>
        <b>What will happen during the study?</b><br>
        This experiment will take place online. You will complete a short English test, then read a series of texts with the blurred mouse-tracking method and answer comprehension questions after each passage. The session will take approximately 30 minutes.
        <br><br>
        <b>Potential Harms, Risks or Discomforts:</b><br>
        There are no known harms or risks associated with the usage of the mouse-tracking technology that we are employing. You may take a break at any time during the experiment.
        <br><br>
        <b>Confidentiality:</b><br>
        All personal information we attain will remain highly confidential. Within this study, you will be identified as a participant number.
        <br><br>
        <b>Participation and Withdrawal:</b><br>
        Your participation in this experiment is entirely optional. You are able to withdraw your data on or before August 31, 2027.
        <br><br>
        This study has been reviewed by the McMaster University Research Ethics Board#: 7316 and received ethics clearance.
        <br><br>
        <b>Consent:</b>
      </p>
      <div style="padding-left: 30px">• I have read and understood the information presented in the information letter (Prolific).</div>
      <div style="padding-left: 30px">• I agree to participate in the study.</div>
      <br>
      <p>Thank you for your help!</p>
      <br>
      <p>Please enter your Prolific ID</p>
      <p><input name="SonaID" type="text" class="obligatory" v-model="$magpie.measurements.SubjectID" placeholder="SONA ID" /></p>
    </div>
    <div
      v-if="$magpie.measurements.SubjectID && !$magpie.validateMeasurements.SubjectID.$invalid"
    >
      <br> By clicking on the button below you consent to participating in this study: <br><br>
      <br />
      <button type="button" @click="$emit('proceed')">Proceed</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConsentPROLIFIC',
};
</script>
