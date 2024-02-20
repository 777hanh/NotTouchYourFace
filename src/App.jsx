import '@tensorflow/tfjs-backend-webgl';
import { useEffect, useRef, useState } from 'react';
import { initNotifications, notify } from '@mycv/f8-notification';
import { Howl } from 'howler';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import * as mobilenet from '@tensorflow-models/mobilenet';

import soundSrc from './assets/bruh.mp3';
import './App.css';

const sound = new Howl({
    src: [soundSrc],
});

const TOUCHED_LABEL = 'touched';
const NOT_TOUCH_LABEL = 'not_touch';
const TRAINING_TIME = 200;
const CONFIDENCE = 0.8;

function App() {
    const videoRef = useRef();
    const classifier = useRef();
    const mobilenetModule = useRef();
    const canPlaySound = useRef(true);

    const [isSetup, setIsSetup] = useState(true);
    const [touched, setTouched] = useState(false);

    // init
    const init = async () => {
        setIsSetup(true);
        // setup camera
        await setupCamera();

        classifier.current = knnClassifier.create();
        mobilenetModule.current = await mobilenet.load();
        setIsSetup(false);

        initNotifications({ cooldown: 3000 });
    };

    // setup camera
    const setupCamera = () => {
        return new Promise((resolve, reject) => {
            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;

            if (navigator.getUserMedia) {
                navigator.getUserMedia(
                    { video: true },
                    (stream) => {
                        videoRef.current.srcObject = stream;
                        videoRef.current.addEventListener('loadeddata', resolve);
                    },
                    (error) => reject(error),
                );
            } else {
                reject();
            }
        });
    };

    const train = async (label) => {
        if (!isSetup) {
            console.clear();
            console.log(`training ${label} `);
            for (let i = 0; i < TRAINING_TIME; i++) {
                console.log('training ' + Math.round(((i + 1) / TRAINING_TIME) * 100) + ' %');

                training(label);
            }
        }
    };

    const training = (label) => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            const embedding = mobilenetModule.current.infer(videoRef.current, true);
            classifier.current.addExample(embedding, label);
            await sleep(100);
            resolve();
        });
    };

    const run = async () => {
        const embedding = mobilenetModule.current.infer(videoRef.current, true);
        const result = classifier.current.predictClass(embedding);

        result.then((result) => {
            if (result.label === TOUCHED_LABEL && result.confidences[result.label] > CONFIDENCE) {
                setTouched(true);
                if (canPlaySound.current) {
                    canPlaySound.current = false;
                    sound.play();
                }
                console.log(result.label);
                notify('Warning', { body: 'You are touched!!!' });
            } else {
                setTouched(false);
            }
        });

        await sleep(200);
        run();
    };

    const sleep = (sleepDuration = 0) => {
        return new Promise((resolve) => {
            setTimeout(resolve, sleepDuration);
        });
    };

    useEffect(() => {
        init();

        // sound end
        sound.on('end', () => {
            canPlaySound.current = true;
        });

        // cleanup function
        return () => {};

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={`App ${touched && 'touched'}`}>
            <video src="" autoPlay className="video" ref={videoRef}></video>
            {!isSetup && (
                <div className="control">
                    <button
                        className="btn"
                        onClick={() => {
                            train(NOT_TOUCH_LABEL);
                        }}
                    >
                        Train 1
                    </button>
                    <button
                        className="btn"
                        onClick={() => {
                            train(TOUCHED_LABEL);
                        }}
                    >
                        Train 2
                    </button>
                    <button
                        className="btn"
                        onClick={() => {
                            run();
                        }}
                    >
                        Run
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;
