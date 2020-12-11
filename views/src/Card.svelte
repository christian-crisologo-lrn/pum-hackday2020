<script>
    export let title = '';
    export let value = ''
    export let textStyle = 'text-success';

</script>

<div class="row g-2 mb-4 gutter">
    <div class="col-12">
    <p class="lead">{title}</p> 
    </div>
    <div class={`col-12 ml-2  lead ${textStyle}`}>
        <p >{value}</p>
    </div>
</div>