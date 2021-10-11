import App from './App.svelte';
import parseQuizdown from './parser.js';
import { Config } from './config.js';
import marked from './customizedMarked.js';
import type { Quiz } from './quiz';

export interface Quizdown {
    register(extension: QuizdownExtension): Quizdown;
    createApp(rawQuizdown: string, node: Element, config: Config ,finFun:(sel:[number[]],score:number)=>void,sel:[number[]]): App;
    parseQuizdown(rawQuizdown: string, config: Config,finFun:(sel:[number[]],score:number)=>void): Quiz;
    init(config: object,finFun:(sel:[number[]],score:number)=>void,sel:[number[]]): void;
    getMarkedParser(): typeof marked;
}

export interface QuizdownExtension {
    setup(quizdown: Quizdown): void;
}

function register(extension: QuizdownExtension): Quizdown {
    extension.setup(this as Quizdown);
    return this as Quizdown;
}

function createApp(rawQuizdown: string, node: Element, config: Config,finFun:(sel:[number[]],score:number)=>void = (a,b)=>{},sel:[number[]]=[[]] ): App {
    node.innerHTML = '';
    let root: ShadowRoot;
    if (!!node.shadowRoot) {
        //clear root if it allready exists
        root = node.shadowRoot;
        root.innerHTML = '';
    } else {
        root = node.attachShadow({ mode: 'open' });
    }
    try {
        let quiz = parseQuizdown(rawQuizdown, config,finFun);
        if(quiz.questions.length==sel.length){
            for(let i=0;i<sel.length;i++){
                quiz.questions[i].selected=sel[i]; 
            }
        }else{
            //console.log('incorect size');
        }
        let app = new App({
            // https://github.com/sveltejs/svelte/pull/5870
            target: root,
            intro: false,
            props: {
                quiz: quiz,
            },
        });
        return app;
    } catch (e) {
        root.innerHTML = `${e}. App could not render. Please check your quizdown syntax.`;
    }
}

function init(config: object = {},finFun:(sel:[number[]],score:number)=>void= (a,b)=>{},sel:[number[]]=[[]]): void {
    let globalConfig = new Config(config);
    if (globalConfig.startOnLoad) {
        if (typeof document !== 'undefined') {
            window.addEventListener(
                'load',
                function () {
                    let nodes = document.querySelectorAll('.quizdown');
                    for (let node of nodes) {
                        createApp(node.innerHTML, node, globalConfig,finFun,sel);
                    }
                },
                false
            );
        }
    }
}

function getMarkedParser(): typeof marked {
    return marked;
}

let quizdown: Quizdown = {
    init,
    register,
    parseQuizdown,
    createApp,
    getMarkedParser,
};

export default quizdown;
