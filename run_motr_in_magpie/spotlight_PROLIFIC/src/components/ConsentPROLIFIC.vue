<template>
  <div>
    <div style="width: 40em; margin: auto;">
      <div style="background-color: lightgrey; padding: 10px;">
        <b>Letter of Information and Consent</b><br>
        Mouse- and eye-tracking
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
        <b>Purpose of the Study:</b> The purpose of this study is to explore whether a new mouse-tracking paradigm can accurately measure text reading behaviours. You are invited to participate in this study, which investigates a new mouse-tracking paradigm during text reading. We hope to learn if mouse-tracking can be used as a quick and accurate substitute for other measures of reading behaviours.
        <br><br>
        <b>What is mouse-tracking?</b><br>
        Mouse-tracking uses an online platform to register the position on the screen where you hover the mouse, and the duration for which you hold that position. In a mouse-tracking paradigm, all text is blurred until you hover over a word. Upon hovering, a small, clear window appears, allowing you to read that portion of the text. You must continue moving the mouse around the screen to read the entirety of the text. Spotlight information can inform researchers about which words are being viewed and for how long. This allows researchers to investigate the cognitive processes used to read and understand written texts.
        <br><br>
        <b>What will happen during the study?</b><br>
        This experiment will take place online. You will be asked to provide some demographic information as well as information about your reading and language background. You will then read a series of texts which are presented with the blurred mouse-tracking method. Your mouse hovers will be recorded while you read the texts. After reading each text, you will be asked to answer a comprehension question. The session will take approximately 30 minutes.
        <br><br>
        We will start by asking you to fill out a questionnaire consisting of personal information, such as age, gender, level of education, and such. Then you will proceed to a series of questions regarding languages spoken and their proficiencies. These tests will be administered as questionnaires that you will need to fill in.
        <br><br>
        This experiment will take place online. Prior to beginning the experiment, you will be asked to give consent by reading this form and pressing a button.
        <br><br>
        For the experiment, you will use your computer mouse to hover over and read the texts on the screen. You will then answer the comprehension questions.
        <br><br>
        <b>Potential Harms, Risks or Discomforts:</b><br>
        There are no known harms or risks associated with the usage of the mouse-tracking technology that we are employing. The present study does require you to sit still and remain focused for a considerable period of time. This study might require you to sit and look at a screen to read texts for up to 30 minutes, which may cause you to become fatigued. You may take a break at any time during the experiment. Also, you may feel upset or worried about your level of performance. We assure you that your best effort is always sufficient. Please note that in rare cases researchers who conduct the experiment may additionally have other academic or professional relationships with you. This may be a source of discomfort for you. It is your informed choice whether to volunteer for an experiment with a potential conflict of interest. If you choose to participate in this experiment and to sign the informed consent form below, you will have the right to withdraw without explanation or penalty, and with the full credit for the experiment (see explanation below).
        <br><br>
        <b>Potential Benefits:</b><br>
        The results of this research will not directly benefit you in any way. We hope to learn more about how words in English are processed.
        <br><br>
        <b>Incentive/Payment or Reimbursement:</b><br>
        Participants will earn the pro-rated minimum hourly wage for their country of data collection, as mandated by Prolific or Besample. For example, Canadian participants will receive approximately $20/hour, divided by the total duration of their participation in minutes.
        <br><br>
        <b>Confidentiality:</b><br>
        All personal information we attain will remain highly confidential. Within this study, you will be identified as a participant number. Any personal information you provide will only be accessible to the principal investigators and co-investigators at McMaster, as well as research assistants. All information will be strictly secured in a locked cabinet or on a password-protected computer. No publication or discussion regarding this study will contain any personal and/or identifying information. As requested by the federal Tri-Council funding agencies and policies, we will retain your data for at least 5 years. Once out of active use, the electronic data will be archived on a secure server in the McMaster research lab.
        <br><br>
        <b>Participation and Withdrawal:</b><br>
        Your participation in this experiment is entirely optional and you can choose to leave at any time without penalization. If you wish to withdraw, you can let the researchers know and all of your data will be discarded. You are able to withdraw your data on or before August 31, 2027.
        <br><br>
        <b>Information about the Study Results:</b><br>
        If you have questions or need more information about the study itself, please contact Victor Kuperman at vickup@mcmaster.ca. Results of studies will also be publicized at https://readlab.humanities.mcmaster.ca/.
        <br><br>
        <b>Questions about the Study:</b><br>
        If you have questions or need more information about the study itself, please contact me at:<br>
        Dr. Victor Kuperman<br>
        vickup@mcmaster.ca
        <br><br>
        This study has been reviewed by the McMaster University Research Ethics Board#: 7316 and received ethics clearance. If you have concerns or questions about your rights as a participant or about the way the study is conducted, please contact: McMaster Research Ethics, Telephone: (905) 525-9140 ext. 23142, E-mail: mreb@mcmaster.ca.
        <br><br>
        <b>Consent:</b>
      </p>
      <div style="padding-left: 30px">
        I have read and understood the information presented in the information letter about a study being conducted by Dr. Victor Kuperman and Dr. Emalie Hendel from McMaster University.
      </div>
      <div style="padding-left: 30px">
        I have had the opportunity to ask questions about my involvement in this study and to receive additional details I requested.
      </div>
      <div style="padding-left: 30px">
        By submitting responses for this experiment, I declare that I have read and agree to the terms presented in this information letter.
      </div>
      <div style="padding-left: 30px">
        I understand that I may withdraw from the study before I submit my responses.
      </div>
      <div style="padding-left: 30px">
        I understand that once responses are submitted, I can withdraw my data on or before August 31, 2027.
      </div>
      <div style="padding-left: 30px">
        I agree to my data being published in an anonymized form, e.g., as part of a journal publication.
      </div>
      <div style="padding-left: 30px">
        I understand that by signing below, I declare that I have read and agree to the terms presented in this information letter.
      </div>
      <div style="padding-left: 30px">I have been given a copy of this form.</div>
      <div style="padding-left: 30px">I agree to participate in the study.</div>
      <br>
      <p>Thank you for your help!</p>
      <br>
      <p>Please enter your Prolific ID</p>
      <p>
        <input
          name="ProlificID"
          type="text"
          class="obligatory"
          v-model="$magpie.measurements.SubjectID"
          placeholder="Prolific ID"
        />
      </p>
    </div>
    <div
      v-if="$magpie.measurements.SubjectID && !$magpie.validateMeasurements.SubjectID.$invalid"
    >
      <br>
      I consent to participate in this study.
      <br><br>
      By clicking on the button below you consent to participating in this study:
      <br><br>
      <button type="button" @click="$emit('proceed')">Proceed</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConsentPROLIFIC',
};
</script>
