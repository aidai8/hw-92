import {Box, CircularProgress} from "@mui/material";

const Spinner = () => {
    return (
        <Box style={{textAlign: "center"}}>
            <CircularProgress color="inherit" />
        </Box>
    );
};

export default Spinner;