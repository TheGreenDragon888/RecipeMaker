// PRESENTATION LAYER: how a tab screen's route tells the tabs layout that a sheet is showing, so the layout can
// move the dock out of the sheet's way. The layout draws the dock above the screens, so a sheet can only reach the
// bottom of the screen once the dock is gone. Outside the tabs (in tests, or a screen with no dock), reporting
// does nothing.
import React, { createContext, useContext } from 'react';

type ReportSheetShown = (shown: boolean) => void;

const ignore: ReportSheetShown = () => {};
const DockVisibilityContext = createContext<ReportSheetShown>(ignore);

type Props = { onSheetShownChange: ReportSheetShown; children: React.ReactNode };

export function DockVisibilityProvider({ onSheetShownChange, children }: Props) {
  return <DockVisibilityContext.Provider value={onSheetShownChange}>{children}</DockVisibilityContext.Provider>;
}

/** For route files: the function to call with true while a sheet shows, and false once it's gone. */
export function useReportSheetShown(): ReportSheetShown {
  return useContext(DockVisibilityContext);
}
