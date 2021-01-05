import React from "react";
import Dialog from "material-ui/Dialog/Dialog";
import FlatButton from "material-ui/FlatButton/FlatButton";
import RaisedButton from "material-ui/RaisedButton/RaisedButton";
import LoadingMask from "d2-ui/lib/loading-mask/LoadingMask.component";
import TextField from "material-ui/TextField/TextField";
import MultiSelect from "../MultiSelect.component";
import snackActions from "../../Snackbar/snack.actions";
import Toggle from "material-ui/Toggle/Toggle";
import PropTypes from "prop-types";

export default class CopyInUserBatchModelsMultiSelectComponent extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.getTranslation = context.d2.i18n.getTranslation.bind(context.d2.i18n);
        this.state = {
            state: "loading",
            parents: null,
            allChildren: null,
            selectedIds: null,
            filterText: "",
            updateStrategy: this.props.parents.length > 1 ? "merge" : "replace",
            copyUserGroups: false,
            copyUserRoles: false,
        };
    }

    styles = {
        dialog: {
            minWidth: 875,
            maxWidth: "100%",
        },
        contents: {
            padding: 15,
            position: "relative",
            height: 450,
            minHeight: 450,
            maxHeight: 450,
            minWidth: 800,
        },
        loadingMask: {
            position: "fixed",
            top: 54,
            right: 22,
            width: 480,
            height: 250,
            background: "rgba(255,255,255,0.6)",
            zIndex: 5,
        },
        controls: {
            position: "fixed",
            top: 156,
            right: 24,
            width: 475,
            zIndex: 1,
            background: "white",
        },
        cancelButton: {
            marginRight: 16,
        },
        toggle: {
            width: 175,
            float: "right",
            marginTop: 20,
            marginRight: 10,
        },
    };

    componentDidMount() {
        const { parents, model } = this.props;
        return Promise.all([model.getAllChildren(), model.getParents(parents)])
            .then(([allChildren, parentsLoaded]) =>
                this.setState({
                    state: "ready",
                    parents: parentsLoaded,
                    allChildren,
                    selectedIds: this.props.model
                        .getSelectedChildren(parentsLoaded)
                        .map(obj => obj.id),
                })
            )
            .catch(err =>
                this.close(this.getTranslation("error_loading_data") + " :" + err.toString())
            );
    }

    close(snackMessage = null) {
        if (snackMessage) snackActions.show({ message: snackMessage });
        this.props.onRequestClose();
    }

    renderStrategyToggle() {
        if (this.state.parents && this.state.parents.length > 1) {
            const label =
                this.getTranslation("update_strategy") +
                ": " +
                this.getTranslation("update_strategy_" + this.state.updateStrategy);

            return (
                <Toggle
                    label={label}
                    style={this.styles.toggle}
                    checked={this.state.updateStrategy === "replace"}
                    onToggle={(ev, newValue) =>
                        this.setState({ updateStrategy: newValue ? "replace" : "merge" })
                    }
                />
            );
        } else {
            return null;
        }
    }
    async copyInUserSave() {
        const { parents, selectedIds, copyUserGroups, copyUserRoles } = this.state;
        await this.props.model
            .copyInUserSave(parents, selectedIds, copyUserGroups, copyUserRoles)
            .then(() => this.close(this.props.onSuccess))
            .catch(err => this.close(this.props.onError));
    }
    onChange(selectedIds) {
        this.setState({ selectedIds });
    }
    render() {
        switch (this.state.state) {
            case "loading":
                return (
                    <div style={this.styles.loadingMask}>
                        <LoadingMask />
                    </div>
                );
            case "error":
                return <div style={this.styles.loadingMask}>{this.state.error}</div>;
            case "ready":
                return this.renderForm();
            default:
                throw new Error(`Unknown state: ${state}`);
        }
    }

    onFilterTextChange(event) {
        this.setState({ filterText: event.target.value });
    }
    getDialogButtons() {
        return [
            <FlatButton
                label={this.getTranslation("cancel")}
                onClick={this.props.onRequestClose}
                style={this.styles.cancelButton}
            />,
            <RaisedButton
                primary
                label={this.getTranslation("save")}
                onClick={
                    this.state.copyUserGroups || this.state.copyUserRoles
                        ? this.copyInUserSave.bind(this)
                        : () =>
                              snackActions.show({
                                  message: "Error: You must select a toggle option",
                              })
                }
            />,
        ];
    }

    render() {
        const isLoading = this.state.state === "loading";
        const { parents, allChildren, filterText, selectedIds } = this.state;
        const title = this.props.getTitle(parents, allChildren);
        const parentName = this.props.parents[0].name;
        const options = _(allChildren || [])
            .sortBy("name")
            .map(obj => ({ value: obj.id, text: obj.name }))
            .filter(obj => obj.text !== parentName)
            .value();
        return (
            <Dialog
                title={title}
                actions={this.getDialogButtons()}
                autoScrollBodyContent
                autoDetectWindowHeight
                contentStyle={this.styles.dialog}
                open={true}
                onRequestClose={this.props.onRequestClose}
            >
                <TextField
                    style={{ marginLeft: 15, marginTop: 5, marginBottom: -15 }}
                    value={filterText}
                    onChange={this.onFilterTextChange.bind(this)}
                    type="search"
                    hintText={`${this.getTranslation("search_by_name")}`}
                />

                {this.renderStrategyToggle()}

                <Toggle
                    label={"User Groups"}
                    style={this.styles.toggle}
                    checked={this.state.copyUserGroups == true}
                    onToggle={(ev, newValue) => this.setState({ copyUserGroups: newValue })}
                />
                <Toggle
                    label={"User Roles"}
                    style={this.styles.toggle}
                    checked={this.state.copyUserRoles === true}
                    onToggle={(ev, newValue) => this.setState({ copyUserRoles: newValue })}
                />
                <div style={this.styles.contents}>
                    <MultiSelect
                        isLoading={isLoading}
                        options={options}
                        onChange={this.onChange.bind(this)}
                        selected={selectedIds}
                        filterText={filterText}
                    />
                </div>
            </Dialog>
        );
    }
}

CopyInUserBatchModelsMultiSelectComponent.propTypes = {
    model: PropTypes.object.isRequired,
    parents: PropTypes.arrayOf(PropTypes.object).isRequired,
    onRequestClose: PropTypes.func.isRequired,
};

CopyInUserBatchModelsMultiSelectComponent.contextTypes = {
    d2: PropTypes.object.isRequired,
};
