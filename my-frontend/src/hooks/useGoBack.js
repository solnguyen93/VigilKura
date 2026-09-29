import { useNavigate } from 'react-router-dom';

// True when there's an earlier VigilKura page in this tab to go back to. React Router
// stores the entry's position as history.state.idx; 0 means the visitor landed here first
// (e.g. opened from a link in a new tab), so browser-back would leave the site.
export const hasInAppHistory = () => (window.history.state?.idx ?? 0) > 0;

// Back-arrow handler: go back within the app when possible, otherwise go to `fallback`
// instead of sending the visitor to whatever was open before VigilKura.
function useGoBack(fallback = '/') {
    const navigate = useNavigate();
    return () => (hasInAppHistory() ? navigate(-1) : navigate(fallback, { replace: true }));
}

export default useGoBack;
