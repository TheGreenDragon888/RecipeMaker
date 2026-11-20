// DATA ACCESS LAYER: the one connection to user.db, shared by every repository that keeps user data there.
import type { WritableSqlDatabase } from './SqlDatabase';

/**
 * Runs work on user.db one task at a time, in the order it was asked for: two transactions on one connection would
 * otherwise overlap (expo-sqlite's withTransactionAsync isn't exclusive), and the last save asked for must be the
 * one that's kept.
 */
export class UserDatabaseQueue {
  private opened: Promise<WritableSqlDatabase> | null = null;
  /** The last task asked for; the next one waits for it to finish, whether it worked or not. */
  private last: Promise<unknown> = Promise.resolve();

  /** `open` opens and migrates user.db. It is called when the first task runs, and only once. */
  constructor(private readonly open: () => Promise<WritableSqlDatabase>) {}

  private database(): Promise<WritableSqlDatabase> {
    this.opened ??= this.open();
    return this.opened;
  }

  inTurn<T>(task: (db: WritableSqlDatabase) => Promise<T>): Promise<T> {
    const run = this.last.then(async () => task(await this.database()));
    this.last = run.catch(() => undefined);
    return run;
  }
}
