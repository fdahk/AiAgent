import workspaceStyles from './style.module.scss';

function WorkspacePage() {
    return (
        <div className={workspaceStyles.workspaceContainer}>
            <div className={workspaceStyles.workspaceHeader}>
                <h1>Workspace</h1>
            </div>
        </div>
    )
}

export default WorkspacePage;