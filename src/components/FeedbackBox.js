import { TextField } from '@material-ui/core';
import React from 'react';
import gandalfImage from '../images/gandalf.png';


const MAX_FEEDBACK_CHARS = 500;

function FeedbackBox({ feedback, setFeedback }) {
  const handleFeedbackChange = (event) => {
    setFeedback(event.target.value.slice(0, MAX_FEEDBACK_CHARS));
  };

  return (
    <div className="flex flex-col items-start pl-2 md:pl-8 mb-8">
      <div className="text-2xl text-green-700 my-1">additional comments</div>
      <div className="text-sm md:text-md text-left text-gray-500 w-5/6 md:w-2/3 mb-4">
        any further suggestions for this year's music, or feedback around the collection process?
      </div>
      <TextField
        style={{ width: '83%', backgroundImage: { gandalfImage } }}
        multiline
        minRows={4}
        value={feedback}
        onChange={handleFeedbackChange}
        label="optional feedback"
        variant="outlined"
        InputProps={{
          style: {
            color: "green"
          },
          inputProps: {
            maxLength: MAX_FEEDBACK_CHARS,
          }
        }}
      />
      {feedback.length >= MAX_FEEDBACK_CHARS - 100 &&
        <div className={"flex flex-row justify-end w-full text-green-600 text-sm text-opacity-60 mt-2 pr-16"}>
          {feedback.length}/{MAX_FEEDBACK_CHARS} characters
        </div>
      }
    </div>
  );
}

export default FeedbackBox;
