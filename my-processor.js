class MyProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
      const output = outputs[0];
      output.forEach(channel => {
        for (let i = 0; i < channel.length; i++) {
          channel[i] = Math.random() * 2 - 1; // Generate white noise
        }
      });
      return true;
    }
  }
  
  registerProcessor('my-processor', MyProcessor);