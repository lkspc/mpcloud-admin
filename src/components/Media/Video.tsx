import React, { FC, useRef, useState } from 'react';
import moment from 'moment';
import styles from './index.less';

function formatDuration(seconds: number) {
  const duration = moment('1900-01-01 00:00:00').add(seconds, 'seconds');

  if (seconds >= 3600) {
    return duration.format('HH:mm:ss');
  }

  return duration.format('mm:ss');
}

const Video: FC<{
  source: string;
}> = ({ source }) => {
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <div className={styles['video-wrapper']}>
      <video
        className={styles.video}
        ref={ref}
        controls={isPlaying}
        src={source}
        onLoadedData={({ target }: any) => setDuration(target.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <track default kind="captions" src="" />
      </video>
      <p className={styles.duration}>{formatDuration(duration)}</p>
    </div>
  );
};

export default Video;
