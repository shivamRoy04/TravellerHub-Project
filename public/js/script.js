(()=>{
    "use strict";
     //Fetch all the forms on which we want to apply the custom bootstrap 
    const forms = document.querySelectorAll(".needs-validation");

    //loop over them and prevent submission
    Array.from(forms).forEach((form)=>{
        form.addEventListener(
            "submit",
            (event)=>{
                if(!form.checkValidity()){
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add("was-validated");
            },
            false
        );
    });


})();