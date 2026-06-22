import { useEffect, useState } from "react";

export default function useMicrophone() {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    let animationId = 0;

    async function init() {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const audioContext = new AudioContext();

      await audioContext.resume();

      const analyser =
        audioContext.createAnalyser();

      analyser.fftSize = 256;

      const source =
        audioContext.createMediaStreamSource(stream);

      source.connect(analyser);

      const dataArray =
        new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        analyser.getByteTimeDomainData(dataArray);

        let sum = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }

        const rms = Math.sqrt(
          sum / dataArray.length
        );

        setLevel(rms);

        animationId =
          requestAnimationFrame(update);
      };

      update();
    }

    init();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return level;
}