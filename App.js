import React, { Component, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";  // the actual SQLite parts


function openDatabase() {
    if (Platform.OS === "web") {
        return {
            transaction: () => {
                return {
                    executeSql: () => { },
                };
            },
        };
    }
    const db = SQLite.openDatabase("db.db");
    return db;
}
const db = openDatabase();

class Items extends Component {
    //function Items({ done: doneHeading, onPressItem }) {
    constructor(props) {
        super(props);
        /* expected props
            done: doneHeading,
            onPressItem,
        */
        this.state = {
            items: null,
        }
    }
    //const [items, setItems] = useState(null);
    setItems = (items) => {
        this.setState({ items: items });
    }

    // This is the same code twice (componentDidMount and componentDidUpdate)
    // It is necessary to do the initial load and refresh from the db after a props update
    componentDidMount() {
        db.transaction((tx) => {
            tx.executeSql(
                `select * from items where done = ?;`,
                [this.props.done ? 1 : 0],
                (_, { rows: { _array } }) => this.setItems(_array)
            );
        });
    }

    componentDidUpdate() {
        db.transaction((tx) => {
            tx.executeSql(
                `select * from items where done = ?;`,
                [this.props.done ? 1 : 0],
                (_, { rows: { _array } }) => this.setItems(_array)
            );
        });
    }

    render() {
        if (this.state.items === null || this.state.items.length === 0) {
            return null;
        }
        let heading = this.props.done ? "Complete" : "Todo";

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeading}>{heading}</Text>
                {this.state.items.map(({ id, done, value }) => (
                    <TouchableOpacity
                        key={id}
                        onPress={() => this.props.onPressItem && this.props.onPressItem(id)}
                        style={{
                            backgroundColor: done ? "#1c9963" : "#fff",
                            borderColor: "#000",
                            borderWidth: 1,
                            padding: 8,
                        }}
                    >
                        <Text style={{ color: done ? "#fff" : "#000" }}>{value}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }
}

export default class App extends Component {
    //export default function App() {
    constructor(props) {
        super(props);
        this.state = {
            text: null,
            forceUpdate: null,
        }
        //const [text, setText] = useState(null);
        //const [forceUpdate, forceUpdateId] = useForceUpdate();
    }

    componentDidMount() {
        db.transaction((tx) => {
            tx.executeSql(
                "create table if not exists items (id integer primary key not null, done int, value text);"
            );
        });
    }

    add = (text) => {
        // is text empty?
        if (text === null || text === "") {
            return false;
        }

        db.transaction(
            (tx) => {
                tx.executeSql("insert into items (done, value) values (0, ?)", [text]);
                tx.executeSql("select * from items", [], (_, { rows }) =>
                    console.log(JSON.stringify(rows))
                );
            },
            null,
            this.state.forceUpdate
        );
    };

    useForceUpdate = () => {
        const [value, setValue] = useState(0);
        return [() => setValue(value + 1), value];
    }


    setText = (text) => {
        this.setState({ text: text });
    }

    forceUpdateId = () => {
        this.setState({ forceUpdate: useForceUpdate() });
    }

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.heading}>SQLite Example</Text>
                {Platform.OS === "web" ? (
                    <View
                        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                    >
                        <Text style={styles.heading}>
                            Expo SQlite is not supported on web!
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.flexRow}>
                            <TextInput
                                onChangeText={(text) => this.setText(text)}
                                onSubmitEditing={() => {
                                    this.add(this.state.text);
                                    this.setText(null);
                                }}
                                placeholder="what do you need to do?"
                                style={styles.input}
                                value={this.state.text}
                            />
                        </View>
                        <ScrollView style={styles.listArea}>
                            <Items
                                key={`forceupdate-todo-${this.forceUpdateId}`}
                                done={false}
                                onPressItem={(id) =>
                                    db.transaction(
                                        (tx) => {
                                            tx.executeSql(
                                                `update items set done = 1 where id = ?;`,
                                                [id,]
                                            );
                                        },
                                        null,
                                        this.state.forceUpdate
                                    )
                                } 
                            />
                            <Items
                                done={true}
                                key={`forceupdate-done-${this.forceUpdateId}`}
                                onPressItem={(id) =>
                                    db.transaction(
                                        (tx) => {
                                            tx.executeSql(
                                                `delete from items where id = ?;`,
                                                [id]
                                            );
                                        },
                                        null,
                                        this.state.forceUpdate
                                    )
                                }
                            />
                        </ScrollView>
                    </>
                )}
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        flex: 1,
        paddingTop: Constants.statusBarHeight,
    },
    heading: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    flexRow: {
        flexDirection: "row",
    },
    input: {
        borderColor: "#4630eb",
        borderRadius: 4,
        borderWidth: 1,
        flex: 1,
        height: 48,
        margin: 16,
        padding: 8,
    },
    listArea: {
        backgroundColor: "#f0f0f0",
        flex: 1,
        paddingTop: 16,
    },
    sectionContainer: {
        marginBottom: 16,
        marginHorizontal: 16,
    },
    sectionHeading: {
        fontSize: 18,
        marginBottom: 8,
    },
});