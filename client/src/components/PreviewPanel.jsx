import React, { useEffect, useMemo, useState } from 'react'

import {SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack} from '@codesandbox/sandpack-react'
import { detectDependencies } from '../utils/sandpackUtils';
import { useAppContext } from '../context/AppContext';
import sandpackErrorMonitor from "../components/sandpackErrorMonitor"

//watches for file edits inside sandpack editor and saves changes to DB & live state
function sandpackFileWatcher({onLiveFilesChange}){
    const {sandpack} = useSandpack();
    const {files} = sandpack;
    const {activeProject , updateProjectFiles} = useAppContext()

    const activeProjectRef = useRef(activeProject)

    useEffect(() => {
        activeProjectRef.current = activeProject;
    } , [activeProject])

    useEffect(() => {
        const project = activeProjectRef.current;
        if(!project) return;
        const updatedFiles = {};
        let hasChanges = false;

        for (const [path , fileObbj] of object.entries(files)) {
            const fileCode = fileObbj.code;
            updatedFiles[path] = fileCode;

            const originalContent = typeof project.files[path] === "string" ? project.files[path] : project.files[path]?.content;

            if(originalContent !== undefined && originalContent !== fileCode){
                hasChanges = true;
            }
        }

        //sync live files to parent
        onLiveFilesChange(updatedFiles)
        if(hasChanges){
            updateProjectFiles(updatedFiles)
        }

    } , [files])

    return null;
}

const PreviewPanel = ({project , activeFile , showCode}) => {
    const [showErrorOverlay , setShowErroOverlay] = useState(true)

    //keep local state of file that updates as user types
    const [liveFiles , setLiveFiles] = useState(project.files);
    const [prevProjectKey , setPrevProjectKey] = useState(`${project._id}-${project.version}`)

    const currentKey = `${project._id}-${project.version}`;

    if(prevProjectKey !== currentKey){
        setPrevProjectKey(currentKey)
        setLiveFiles(project.files)
    }


    const handleLiveFileChange = (newFiles) => {
        setLiveFiles((prev) => {
            let changed = false;
            for (const [p , code] of object.entries(newFiles)) {
                if(prev[p] !== code){
                    changed = true;
                    break;
                }
            }
            return changed ? newFiles : prev;
        })
    }

    //convert livefile to sandpack formate
    const sandpackFiles = useMemo(() => {
        const spFiles = {};
        for (const [path , content] of Object.entries(liveFiles)) {
            const fileCode = typeof content === "string" ? content : content?.content || "";

            spFiles[path] = {
                code: fileCode,
                active: path === activeFile,
            }
        }

        return spFiles;
    } , [liveFiles , activeFile])

    //detect dependecies from import statement using liveFiles

    const dependencies = useMemo(() => {
        return detectDependencies(liveFiles)
    } , [liveFiles])

  return (
    <div className='w-full h-full'>

        <SandpackProvider 
        key={project._id} 
        template='react' 
        files={sandpackFiles} 
        customSetup={{dependencies}} 
        options={{
            externalResources: [
                "https://cdn.tailwindcss.com",
                "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
            ],
            classes: {
                "sp-wrapper": "sp-wrapper",
                "sp-layout": "sp-layout",
                "sp-preview": "sp-preview",
            },
            logLevel: 0,
        }} 
        theme={{
            colors: {
                surface1: "#ffffff",
                surface2: "#f4f4f5",
                surface3: "#e4e4e7",
                clickable: "#71717a",
                base: "#09090b",
                disabled: "#a1a1aa",
                hover: "#18181b",
                accent: "#18181b",
                error: "#ef4444",
                errorSurface: "#fef2f2",
            },

            font: {
                body: "'Urbanist', system-ui, -apple-system, sans-serif",
                mono: "'Geist Mono', ui-monospace, monospace",
                size: "13px",
                lineHeight: "1.6",
            },
        }} >

            <sandpackFileWatcher 
            onLiveFilesChange={handleLiveFileChange}
            />

            <sandpackErrorMonitor onErrorChange={setShowErroOverlay}/>

            <SandpackLayout 
            style={{
                height: "100%",
                border: "none",
                borderRadius: 0,
                background: "transparent"
            }}
            >
                {showCode && (
                    <SandpackCodeEditor showTabs showLineNumbers showInlineErrors wrapContent style={{height:"100%" , flex:1, minWidth:0}}/>
                )}

                <SandpackPreview showNavigator={false} showRefreshButton showOpenInCodeSandbox={false} showSandpackErrorOverlay={showErrorOverlay} style={{height:"100%" , flex: showCode ? 1 : 2 , minWidth:0}}/>
            </SandpackLayout>



        </SandpackProvider>

        
    </div>
  )
}

export default PreviewPanel