/**
 * View component for /tasks/:taskId
 *
 * Displays a single task from the 'byId' map in the task reducer
 * as defined by the 'selected' property
 */

// import primary libraries
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import moment from "moment";

// import actions
import * as taskActions from "../taskActions";
import * as noteActions from "./../../note/noteActions";
import * as userActions from "./../../user/userActions";

// import global components
import Binder from "../../../global/components/Binder.js.jsx";

// import resource components
import TaskLayout from "../components/TaskLayout.js.jsx";
import NoteForm from "../../note/components/NoteForm.js.jsx";

class SingleTask extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, match } = this.props;
    dispatch(taskActions.fetchSingleIfNeeded(match.params.taskId));
    dispatch(noteActions.fetchListIfNeeded("_task", match.params.taskId));
    dispatch(userActions.fetchListIfNeeded());
  }

  mergeById(a1, a2) {
    return a1.map((itm) => ({
      ...a2.find((item) => item.id === itm.id && item),
      ...itm,
    }));
  }

  _handleFormChange(e) {
    /**
     * This let's us change arbitrarily nested objects with one pass
     */
    let newState = _.update(this.state, e.target.name, () => {
      return e.target.value;
    });
    this.setState({ newState });
  }

  _handleFormSubmit(e) {
    const { dispatch, history, currentUser, match } = this.props;
    let newNote = { ...this.state.note };
    newNote._task = match.params.taskId;
    newNote._user = currentUser._id;
    e.preventDefault();
    dispatch(noteActions.sendCreateNote(newNote)).then((noteRes) => {
      if (noteRes.success) {
        dispatch(noteActions.invalidateList());
        history.push(`/tasks/${newNote._task}`);
      } else {
        alert("ERROR - Check logs");
      }
    });
  }

  render() {
    const { taskStore, noteStore, userStore, match } = this.props;

    const noteList =
      noteStore.lists && noteStore.lists._task
        ? noteStore.lists._task[match.params.taskId]
        : null;

    let noteListItems = noteStore.util.getList("_task", match.params.taskId);

    if (noteListItems && userStore.util.getList()) {
      noteListItems = this.mergeById(noteListItems, userStore.util.getList());
    }

    const isNoteListEmpty = !noteListItems || !noteList;

    const isNoteListFetching =
      !noteListItems || !noteList || noteList.isFetching;
    /**
     * use the selected.getItem() utility to pull the actual task object from the map
     */
    const selectedTask = taskStore.selected.getItem();

    const isEmpty =
      !selectedTask || !selectedTask._id || taskStore.selected.didInvalidate;

    const isFetching = taskStore.selected.isFetching;

    return (
      <TaskLayout>
        <h3> Single Task </h3>
        {isEmpty ? (
          isFetching ? (
            <h2>Loading...</h2>
          ) : (
            <h2>Empty.</h2>
          )
        ) : (
          <div style={{ opacity: isFetching ? 0.5 : 1 }}>
            <h1> {selectedTask.name}</h1>
            <hr />
            <Link to={`${this.props.match.url}/update`}> Update Task </Link>
            {isNoteListEmpty ? (
              isNoteListFetching ? (
                <h2>Loading...</h2>
              ) : (
                <h2>Empty.</h2>
              )
            ) : (
              <div style={{ opacity: isNoteListFetching ? 0.5 : 1 }}>
                <ul>
                  {noteListItems.map((note, i) => (
                    <li key={note._id + i}>
                      <h3>
                        {note.firstName} {note.lastName}
                      </h3>{" "}
                      <p>{`${moment(note.created).format(
                        "DD/MM/YYYY"
                      )} @ ${moment(note.created).format("h:mm:ss a")}`}</p>
                      <p>{note.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </TaskLayout>
    );
  }
}

SingleTask.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStoreToProps = (store) => {
  /**
   * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
   * differentiated from the React component's internal state
   */
  return {
    taskStore: store.task,
    noteStore: store.note,
    userStore: store.user,
    defaultNote: store.note.defaultItem,
  };
};

export default withRouter(connect(mapStoreToProps)(SingleTask));
